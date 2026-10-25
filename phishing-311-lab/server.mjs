import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {Store} from './quarantine.mjs';
export function createApp(store) {
 const token=crypto.randomBytes(32).toString('hex'); const nonce=crypto.randomBytes(18).toString('base64');
 const server=http.createServer(async(req,res)=>{
  const host=`127.0.0.1:${server.address().port}`;
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Security-Policy',`default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`);
  const send=(status,value,type='application/json')=>{res.writeHead(status,{'Content-Type':type});res.end(type==='application/json'?JSON.stringify(value):value);};
  if(req.headers.host!==host)return send(403,{error:'Loopback host required'});
  if(req.method==='GET' && req.url==='/')return send(200,`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="token" content="${token}"><title>The Duelist — quarantine prototype</title><style nonce="${nonce}">body{background:#171614;color:#e9e4d9;font:18px/1.6 system-ui;max-width:1000px;margin:auto;padding:24px}h1{overflow-wrap:anywhere;font-size:28px}article{border:1px solid #777;padding:20px;margin:20px 0}button{font:inherit;margin:8px;padding:10px;background:#d7e594;color:#171614;cursor:pointer}pre{white-space:pre-wrap;overflow-wrap:anywhere}#error{color:#ffb5a0}</style><p id="error" role="alert"></p><main id="app"></main><script nonce="${nonce}" src="/app.js"></script></html>`,'text/html; charset=utf-8');
  if(req.method==='GET'&&req.url==='/app.js')return send(200,fs.readFileSync(new URL('./app.js',import.meta.url),'utf8'),'text/javascript');
  if(req.headers['x-local-token']!==token)return send(403,{error:'Local token required'});
  if(req.method==='GET'&&req.url==='/api/messages')return send(200,store.state);
  if(req.method==='POST'&&req.url==='/api/action'){
   if(req.headers.origin!==`http://${host}`)return send(403,{error:'Same origin required'});
   if(req.headers['content-type']!=='application/json')return send(415,{error:'JSON required'});
   try {
    let body=''; for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>4096)return send(413,{error:'Request too large'});}
    const value=JSON.parse(body); if(typeof value.id!=='string'||typeof value.action!=='string')throw new Error('id and action required');
    return send(200,store.act(value.id,value.action));
   }catch(e){return send(400,{error:e.message});}
  }
  send(404,{error:'Not found'});
 });return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const dir=process.argv[2]||'.local-state';fs.mkdirSync(dir,{recursive:true,mode:0o700});
 const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures.json',import.meta.url)));
 const server=createApp(new Store(fixtures,path.join(dir,'state.json')));
 server.listen(0,'127.0.0.1',()=>console.log(`The Duelist: http://127.0.0.1:${server.address().port}`));
}
