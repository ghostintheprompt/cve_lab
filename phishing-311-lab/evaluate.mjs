import fs from 'node:fs';
import {evaluate,baseline,classify,hash} from './quarantine.mjs';
const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures.json',import.meta.url)));
console.log(JSON.stringify({scope:'Hand-authored synthetic fixtures; no email provider or real-user test. Labels are authored scenario intent, not inferred ground truth.',fixtures_sha256:hash(fixtures),baseline:evaluate(fixtures,baseline),candidate:evaluate(fixtures,m=>classify(m).decision)},null,2));
