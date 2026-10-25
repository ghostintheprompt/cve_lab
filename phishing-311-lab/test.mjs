import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { describeLink, createFixture, clientScript, summarizeReport } from './lab.mjs';

test('fragment preserved separately from request URL', () => {
  assert.deepEqual(describeLink('https://example.test/a?q=1#MARKER'), {requestURL:'https://example.test/a?q=1',fragment:'#MARKER',host:'example.test'});
});
test('different fragments share request URL', () => assert.equal(describeLink('https://example.test/a#one').requestURL, describeLink('https://example.test/a#two').requestURL));
test('non-HTTP scheme rejected', () => assert.throws(() => describeLink('javascript:alert(1)')));
test('embedded credentials rejected', () => assert.throws(() => describeLink('https://user:secret@example.test/')));
test('client script writes literal text in a stub DOM', () => {
  const node = {}; vm.runInNewContext(clientScript, {document:{querySelector:()=>node},location:{hash:'#<b>MARKER</b>'}});
  assert.equal(node.textContent, '<b>MARKER</b>');
});
test('empty fragment has explicit display', () => {
  const node = {}; vm.runInNewContext(clientScript, {document:{querySelector:()=>node},location:{hash:''}});
  assert.equal(node.textContent, '(empty)');
});
test('loopback fetch strips fragment and serves same body', async () => {
  const observations = []; const server = createFixture(observations);
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}/fixture`;
    const first = await fetch(base+'#ONE'); const second = await fetch(base+'#TWO');
    assert.equal(first.status,200); assert.equal(await first.text(),await second.text());
    assert.deepEqual(observations.map(x=>x.target),['/fixture','/fixture']);
    assert.match(first.headers.get('content-security-policy'),/form-action 'none'/);
  } finally { await new Promise(resolve=>server.close(resolve)); }
});
const record = {sample_sha256:'a'.repeat(64),reported_at:'2026-10-25T12:00:00Z',report_channel:'synthetic fixture'};
test('submission alone leaves action unknown',()=>assert.equal(summarizeReport(record).observation,'NO_FOLLOWUP_RECORDED'));
test('404 does not prove takedown',()=>{
  const result=summarizeReport({...record,followup_at:'2026-10-25T13:00:00Z',followup_http_status:404});
  assert.equal(result.observation,'HTTP_404_RECORDED'); assert.equal(result.provider_action,'UNKNOWN');
});
test('missing evidence rejected',()=>assert.throws(()=>summarizeReport({})));
test('bad status rejected',()=>assert.throws(()=>summarizeReport({...record,followup_http_status:999})));
test('follow-up before report rejected',()=>assert.throws(()=>summarizeReport({...record,followup_at:'2026-10-24T13:00:00Z',followup_http_status:200})));
