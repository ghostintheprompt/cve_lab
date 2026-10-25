const root=document.querySelector('#app');
const token=document.querySelector('meta[name=token]').content;
async function api(path,body) {
 const r=await fetch(path,{method:body?'POST':'GET',headers:{'X-Local-Token':token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 if(!r.ok) throw new Error(await r.text()); return r.json();
}
function element(tag,text,parent=root) {const e=document.createElement(tag); if(text!==undefined)e.textContent=text;parent.append(e);return e;}
async function render(){
 const state=await api('/api/messages'); root.replaceChildren();
 element('h1','messagefromcriminalsthatgooglecanstopiftheywant');
 element('p','The Duelist / local prototype / synthetic messages. The folder name is satire.');
 element('p','Every message stays plain text, even after release. No original links, images, forms, scripts, or attachments run here. Reports stay on this computer.');
 for(const folder of ['quarantine','inbox']) {
  const section=element('section'); element('h2',folder==='quarantine'?'Phishing — suspected':'Inbox — local review',section);
  for(const m of state.messages.filter(m=>m.decision===folder)) {
   const box=element('article',undefined,section); element('h3',m.subject,box); element('p',m.sender,box); element('p',m.body,box);
   element('p','Signals: '+(m.reasons.join(', ')||'No rule matched; this is not a safety verdict.'),box);
   const details=element('details',undefined,box);element('summary','Inspect original HTML as text',details);element('pre',m.html||'(no HTML supplied)',details);
   element('p','Sample SHA-256: '+m.original_sha256,box);
   if(m.reported) element('pre',JSON.stringify(m.reported,null,2),box);
   for(const [action,label] of [[folder==='quarantine'?'release':'quarantine',folder==='quarantine'?'Mark as incorrectly quarantined':'Move to Phishing'],['report','Report locally'],...(m.reported?.status==='received'?[['review','Start local review']]:[]),...(m.reported?.status==='reviewing'?[['resolve','Close local review']]:[])]) {
    const button=element('button',label,box);button.onclick=async()=>{button.disabled=true;try{await api('/api/action',{id:m.id,action});await render();}catch(e){document.querySelector('#error').textContent=e.message;button.disabled=false;}};
   }
   const history=element('details',undefined,box);element('summary','Local status history',history);element('pre',JSON.stringify(m.history,null,2),history);
  }
 }
}
render().catch(e=>document.querySelector('#error').textContent=e.message);
