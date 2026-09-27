import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validQuery, mapRecord, search, makeServer } from './server.mjs';
test('query validation',()=>{assert.equal(validQuery('設備'),true);assert.equal(validQuery('a'),false);assert.equal(validQuery('設備 省力化'),false)});
test('mapping',()=>{const x=mapRecord({id:'abc',title:'確認用',subsidy_max_limit:200},'2026-09-27');assert.equal(x.amount,200);assert.equal(x.origin,'live')});
test('official params',async()=>{const out=await search('設備',true,async url=>{assert.equal(url.searchParams.get('acceptance'),'1');return {ok:true,json:async()=>({result:[]})}});assert.equal(out.items.length,0)});
test('failure does not synthesize',async()=>{await assert.rejects(search('失敗試験',true,async()=>({ok:false,status:503})),/Upstream unavailable/)});
test('server health',async()=>{const s=makeServer().listen(0);try{const res=await fetch('http://127.0.0.1:'+s.address().port+'/api/health');assert.equal(res.status,200);assert.deepEqual(await res.json(),{ok:true})}finally{s.close()}});
