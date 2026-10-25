import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {Store,classify,evaluate,baseline} from './quarantine.mjs';import {createApp} from './server.mjs';
const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures.json',import.meta.url)));
test('classifier leaves reasons and exposes a semantic miss',()=>{assert.equal(classify(fixtures[0]).decision,'quarantine');assert.equal(classify(fixtures[5]).decision,'inbox');});
test('training quotation produces a visible false positive',()=>assert.equal(classify(fixtures[7]).decision,'quarantine'));
test('cloud hostname and table alone do not trigger candidate',()=>assert.equal(classify(fixtures[9]).decision,'inbox'));
test('evaluation reports both errors without hiding individual cases',()=>{const r=evaluate(fixtures,m=>classify(m).decision);assert.deepEqual([r.tp,r.fp,r.tn,r.fn],[5,1,5,1]);assert.equal(r.cases.length,12);});
test('baseline and candidate are scored on same fixtures',()=>{const r=evaluate(fixtures,baseline);assert.deepEqual([r.tp,r.fp,r.tn,r.fn],[2,1,5,4]);});
test('empty metrics remain undefined',()=>assert.equal(evaluate([],baseline).precision,null));
test('invalid labels rejected',()=>assert.throws(()=>evaluate([{label:'maybe'}],baseline)));
test('ground truth is withheld from application state',()=>assert.ok(new Store(fixtures).state.messages.every(m=>!('label'in m))));
test('release preserves exact original and permits re-quarantine',()=>{const s=new Store(fixtures);const before=s.state.messages[0].original_sha256;s.act('p1','release');assert.equal(s.state.messages[0].decision,'inbox');s.act('p1','quarantine');assert.equal(s.state.messages[0].original_sha256,before);assert.equal(s.state.messages[0].history.length,2);});
test('report receipt is idempotent and keeps provider unknown',()=>{const s=new Store(fixtures);const m=s.act('p1','report');const id=m.reported.case_id;s.act('p1','report');assert.equal(m.reported.case_id,id);assert.equal(m.history.length,1);assert.equal(m.reported.provider_action,'UNKNOWN');});
test('out-of-order resolution rejected',()=>assert.throws(()=>new Store(fixtures).act('p1','resolve')));
test('valid review workflow has explicit local closure',()=>{const s=new Store(fixtures);s.act('p1','report');s.act('p1','review');const m=s.act('p1','resolve');assert.equal(m.reported.status,'resolved_locally');assert.equal(m.history.length,3);});
test('unknown actions and IDs rejected',()=>{const s=new Store(fixtures);assert.throws(()=>s.act('absent','report'));assert.throws(()=>s.act('p1','delete'));});
test('state survives restart',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'duelist-'));try{const file=path.join(dir,'state.json');new Store(fixtures,file).act('p1','report');assert.equal(new Store(fixtures,file).state.messages[0].reported.status,'received');assert.equal(fs.statSync(file).mode&0o777,0o600);}finally{fs.rmSync(dir,{recursive:true});}});
test('HTTP UI and API enforce local mutation boundary',async()=>{
 const s=new Store(fixtures);const server=createApp(s);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 try{
  const page=await fetch(base);const html=await page.text();assert.equal(page.status,200);assert.ok(!html.includes(fixtures[0].html));assert.match(page.headers.get('content-security-policy'),/default-src 'none'/);
  const token=html.match(/name="token" content="([a-f0-9]+)"/)[1];
  assert.equal((await fetch(base+'/api/messages')).status,403);
  const headers={'X-Local-Token':token,'Content-Type':'application/json',Origin:base};
  const list=await fetch(base+'/api/messages',{headers});assert.equal((await list.json()).messages.length,12);
  assert.equal((await fetch(base+'/api/action',{method:'POST',headers:{...headers,Origin:'https://example.test'},body:JSON.stringify({id:'p1',action:'report'})})).status,403);
  const report=await fetch(base+'/api/action',{method:'POST',headers,body:JSON.stringify({id:'p1',action:'report'})});assert.equal(report.status,200);assert.equal((await report.json()).reported.status,'received');
  assert.equal((await fetch(base+'/api/action',{method:'POST',headers,body:JSON.stringify({id:'p1',action:'resolve'})})).status,400);
  const script=await(await fetch(base+'/app.js')).text();assert.ok(!script.includes('innerHTML'));assert.ok(!script.includes('href='));assert.ok(script.includes('textContent'));
 }finally{await new Promise(r=>server.close(r));}
});
