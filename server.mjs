import http from 'node:http';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT||4173);
const cache=new Map();
const CACHE_MS=20*60*1000;
export function validQuery(q){return typeof q==='string'&&q.trim().length>=2&&q.trim().length<=64&&!/\s/.test(q)}
export function mapRecord(row,now){if(!row||typeof row!=='object'||typeof row.id!=='string'||!row.id||typeof row.title!=='string'||!row.title)return null;
 const date=s=>typeof s==='string'&&!Number.isNaN(Date.parse(s))?s:null;
 const limit=typeof row.subsidy_max_limit==='number'&&Number.isFinite(row.subsidy_max_limit)?row.subsidy_max_limit:null;
 const link=typeof row.front_subsidy_detail_page_url==='string'&&/^https:\/\//.test(row.front_subsidy_detail_page_url)?row.front_subsidy_detail_page_url:'https://www.jgrants-portal.go.jp/grants/view/'+encodeURIComponent(row.id);
 return{id:'jg-'+row.id,title:row.title,source:'Jグランツ',origin:'live',url:link,region:String(row.target_area_search||'要確認'),institution:String(row.institution_name||'要確認'),amount:limit,start:date(row.acceptance_start_datetime),end:date(row.acceptance_end_datetime),summary:typeof row.subsidy_catch_phrase==='string'?row.subsidy_catch_phrase:'公募要領と応募資格は公式ページで確認してください。',recorded:now};}
export async function search(keyword,force=false,fetcher=fetch){if(!validQuery(keyword))throw Object.assign(new Error('invalid query'),{status:400});let hit=cache.get(keyword);if(!force&&hit&&Date.now()-hit.when<CACHE_MS)return{...hit.payload,cached:true};
 const u=new URL('https://api.jgrants-portal.go.jp/exp/v1/public/subsidies');u.searchParams.set('keyword',keyword);u.searchParams.set('sort','acceptance_end_datetime');u.searchParams.set('order','ASC');u.searchParams.set('acceptance','1');
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
 try{const resp=await fetcher(u,{headers:{Accept:'application/json'},signal:controller.signal});if(!resp.ok)throw new Error('jGrants returned '+resp.status);const data=await resp.json();if(!Array.isArray(data.result))throw new Error('jGrants unexpected response');const now=new Date().toISOString();const payload={items:data.result.slice(0,80).map(x=>mapRecord(x,now)).filter(Boolean),fetchedAt:now,stale:false,cached:false};cache.set(keyword,{when:Date.now(),payload});if(cache.size>50)cache.delete(cache.keys().next().value);return payload}
 catch(e){console.error('J-Grants API unavailable:',e.message);if(hit)return{...hit.payload,cached:true,stale:true};throw Object.assign(new Error('Upstream unavailable'),{status:503})}finally{clearTimeout(timer)}}
export function makeServer(){return http.createServer(async(req,res)=>{const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');if(req.method!=='GET'){res.writeHead(405);res.end('Method Not Allowed');return}
 if(url.pathname==='/api/health'){res.writeHead(200,{'content-type':'application/json; charset=utf-8'});res.end(JSON.stringify({ok:true}));return}
 if(url.pathname==='/api/search'){res.setHeader('content-type','application/json; charset=utf-8');try{const q=url.searchParams.get('keyword')||'';if(!validQuery(q)){res.writeHead(400);res.end(JSON.stringify({error:'キーワードは空白なしの2〜64文字です'}));return}const data=await search(q,url.searchParams.get('refresh')==='1');res.writeHead(200,{'Cache-Control':'private, max-age=30'});res.end(JSON.stringify(data))}catch(err){res.writeHead(err.status||503);res.end(JSON.stringify({error:'公式APIから取得できませんでした'}))}return}
 if(url.pathname!=='/'&&url.pathname!=='/index.html'){res.writeHead(404);res.end('Not found');return}
 const content=await fs.readFile(path.join(root,'index.html'));res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-cache'});res.end(content)})}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1]))makeServer().listen(port,'0.0.0.0',()=>console.log('公募コンパス http://localhost:'+port));