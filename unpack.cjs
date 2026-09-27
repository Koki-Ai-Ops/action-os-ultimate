const fs=require('node:fs');
const zlib=require('node:zlib');
const cp=require('node:child_process');
const crypto=require('node:crypto');
const bytes=fs.readFileSync('source.tar.br');
fs.writeFileSync('source.tar',zlib.brotliDecompressSync(bytes));
cp.execFileSync('tar',['xf','source.tar']);
const patch=zlib.brotliDecompressSync(fs.readFileSync('upgrade.cjs.br'));
const actual=crypto.createHash('sha256').update(patch).digest('hex');
if(actual!=='c4bf7251d3db543990a5608001f0885da87bd75c05ddac5dc4a38e7650c21fd7')throw Error('Upgrade checksum mismatch');
fs.writeFileSync('upgrade.cjs',patch);
cp.execFileSync(process.execPath,['upgrade.cjs'],{stdio:'inherit'});
const tests=String.raw`import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findCandidates,validCandidateQuery,createServer} from './server.mjs';
test('candidate search can use partial source information',async()=>{
const result=await findCandidates('予約',{force:true,loader:async (u)=>({ok:true,text:async()=>JSON.stringify(u.hostname==='ja.wikipedia.org'?{pages:[{title:'予約サービス',key:'Service',excerpt:'参考情報'}]}:{search:[]})})});
assert.equal(result.items.length,1);
assert.equal(result.items[0].name,'予約サービス');
assert.ok(result.items[0].sourceUrl.includes('wikipedia.org'));
assert.equal('officialUrl' in result.items[0],false);
});
test('candidate search rejects underspecified input',async()=>{
assert.equal(validCandidateQuery('a'),'');
const s=createServer().listen(0);
try{const response=await fetch('http://127.0.0.1:'+s.address().port+'/api/discover?q=x');assert.equal(response.status,400);}finally{s.close();}
});
`;
fs.writeFileSync('discovery.test.mjs',tests);
cp.execFileSync('tar',['cf','source.tar','index.html','style.css','app.js','discovery.js','server.mjs','server.test.mjs','discovery.test.mjs','package.json','render.yaml','README.md','favicon.svg','.gitignore']);
console.log('Source patch applied and validated');