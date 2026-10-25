import fs from 'node:fs';
import crypto from 'node:crypto';
export const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function classify(message) {
  const text = `${message.subject} ${message.body}`.toLowerCase();
  const reasons = [];
  if (/password|one-time code/.test(text)) reasons.push('Credential or code language');
  if (/gift cards|remote access|bank details/.test(text)) reasons.push('Sensitive action language');
  if (/account will close|do not call|remain secret/.test(text)) reasons.push('Pressure or verification avoidance');
  return {decision:reasons.length ? 'quarantine':'inbox', reasons};
}
export function baseline(message) {
  return /urgent|verify your password/i.test(message.subject) ? 'quarantine':'inbox';
}
export class Store {
  constructor(messages, file = null) {
    this.file = file;
    this.state = file && fs.existsSync(file) ? JSON.parse(fs.readFileSync(file,'utf8')) : {
      version:1, messages: messages.map(({label,...m})=>({...m,original_sha256:hash(m),...classify(m),reported:null,history:[]}))
    };
    if (this.state.version !== 1 || !Array.isArray(this.state.messages)) throw new Error('Unsupported state');
  }
  save() {
    if (!this.file) return;
    const tmp=this.file+'.tmp'; fs.writeFileSync(tmp,JSON.stringify(this.state,null,2),{mode:0o600}); fs.renameSync(tmp,this.file);
  }
  act(id, action) {
    const m=this.state.messages.find(x=>x.id===id); if (!m) throw new Error('Unknown message');
    const at=new Date().toISOString();
    if(action==='report') {
      if(m.reported) return m;
      m.reported={case_id:crypto.randomUUID(),received_at:at,status:'received',provider_action:'UNKNOWN'};
      m.decision='quarantine';
    } else if(action==='review') {
      if(!m.reported || m.reported.status!=='received') throw new Error('Report must be received');
      m.reported.status='reviewing';
    } else if(action==='resolve') {
      if(!m.reported || m.reported.status!=='reviewing') throw new Error('Report must be reviewing');
      m.reported.status='resolved_locally';
    } else if(action==='release') {
      m.decision='inbox';
    } else if(action==='quarantine') {
      m.decision='quarantine';
    } else throw new Error('Unknown action');
    m.history.push({action,at,actor:'local_operator'}); this.save(); return m;
  }
}
export function evaluate(messages, detector) {
  const result={tp:0,fp:0,tn:0,fn:0}; const cases=[];
  for(const m of messages) {
    if(!['phishing','benign'].includes(m.label)) throw new Error('Unknown label');
    const decision=detector(m); const positive=decision==='quarantine';
    if(!['quarantine','inbox'].includes(decision)) throw new Error('Invalid decision');
    const key=m.label==='phishing'?(positive?'tp':'fn'):(positive?'fp':'tn'); result[key]++;
    cases.push({id:m.id,label:m.label,decision,result:key});
  }
  return {...result,precision:result.tp+result.fp?result.tp/(result.tp+result.fp):null,
    recall:result.tp+result.fn?result.tp/(result.tp+result.fn):null,cases};
}
