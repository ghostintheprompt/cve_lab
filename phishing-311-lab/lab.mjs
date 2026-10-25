import http from 'node:http';
import { pathToFileURL } from 'node:url';

export function describeLink(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('HTTP(S) required');
  if (url.username || url.password) throw new Error('Embedded credentials rejected');
  const fragment = url.hash;
  url.hash = '';
  return { requestURL: url.href, fragment, host: url.hostname };
}

// Literal text only: this fixture never navigates to a supplied destination.
export const clientScript = `document.querySelector('#fragment').textContent = location.hash.slice(1) || '(empty)';`;
export const html = `<!doctype html><meta charset="utf-8"><title>311 fragment fixture</title>
<h1>Local fragment observation</h1><p>Browser fragment: <code id="fragment"></code></p>
<p>No login, form, redirect, or external resource.</p><script>${clientScript}</script>`;

export function createFixture(observations = []) {
  return http.createServer((req, res) => {
    observations.push({ method: req.method, target: req.url });
    if (req.url !== '/fixture') { res.writeHead(404); res.end('Fixture not found'); return; }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'" });
    res.end(html);
  });
}

// These are operator-supplied observations, never a provider's takedown verdict.
export function summarizeReport(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error('Record required');
  for (const key of ['sample_sha256', 'reported_at', 'report_channel']) {
    if (typeof record[key] !== 'string' || !record[key].trim()) throw new Error(`Missing ${key}`);
  }
  if (!/^[a-f0-9]{64}$/i.test(record.sample_sha256)) throw new Error('Invalid SHA-256');
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(record.reported_at) || !Number.isFinite(Date.parse(record.reported_at))) throw new Error('UTC timestamp required');
  const status = record.followup_http_status ?? null;
  if (status !== null && (!Number.isInteger(status) || status < 100 || status > 599)) throw new Error('Invalid HTTP status');
  if (status !== null && (typeof record.followup_at !== 'string' || !Number.isFinite(Date.parse(record.followup_at)) || !record.followup_at.endsWith('Z') || Date.parse(record.followup_at) < Date.parse(record.reported_at))) throw new Error('Ordered UTC follow-up required');
  return { sample_sha256: record.sample_sha256, reported_at: record.reported_at,
    report_channel: record.report_channel, followup_at: record.followup_at ?? null,
    observation: status === null ? 'NO_FOLLOWUP_RECORDED' : `HTTP_${status}_RECORDED`,
    provider_action: 'UNKNOWN', warning_coverage: 'UNKNOWN', victim_outcome: 'UNKNOWN' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createFixture();
  server.listen(0, '127.0.0.1', () => {
    console.log(`Open http://127.0.0.1:${server.address().port}/fixture#LOCAL-MARKER`);
    console.log('Loopback only. Ctrl-C stops the fixture.');
  });
}
