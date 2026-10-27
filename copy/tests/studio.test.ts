import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { createApp } from '../http.js';
import { loadCopyLibrary } from '../library.js';
import { studioInput, checkOutput, factsFrom, writeCopy, type CopyOutput } from '../studio.js';
const library=await loadCopyLibrary(undefined,false);
const brief=studioInput.parse({task:'Skriv en annons om en byrå.',audience:'Egenföretagare',channel:'annons',facts:'Tjänsten kostar 995 kr/mån.',mustKeep:'Bokslut offereras separat.'});
const output:CopyOutput={text:'Från 995 kr/mån. Bokslut offereras separat.',headlines:['Bokföring att lämna över.'],angle:'Konkret erbjudande.',frameworks:[{id:'hormozi-offer',application:'Pris och omfattning'}],questions:[],claims:[{quote:'995 kr/mån',factIds:['F1']}],changes:[]};

test('claims must match the text and known facts; exact conditions cannot silently disappear',()=>{
  const result=checkOutput({...output,text:'995 kr/mån. Du sparar 10 timmar.',claims:[...output.claims,{quote:'Du sparar 10 timmar.',factIds:['invented']},{quote:'999 kunder',factIds:['F1']}],frameworks:[{id:'invented',application:'Fake'}]},factsFrom(brief),library);
  assert.equal(result.frameworks.length,0);assert.equal(result.claims.length,2);assert.deepEqual(result.claims[1].factIds,[]);
  assert.ok(result.findings.some(f=>f.kind==='condition'));assert.ok(result.findings.some(f=>f.text.includes('10 timmar')));
});
test('writer and editor receive the same facts and native Swedish guide, and edited output wins',async()=>{
  const calls:{system:string;input:string}[]=[];const stages:string[]=[];
  const result=await writeCopy(brief,library,new AbortController().signal,s=>stages.push(s),async(system,input)=>{calls.push({system,input});return{output:{...output,text:calls.length===1?'Första utkast':output.text},id:'fixture',inputTokens:10,outputTokens:20};});
  assert.equal(calls.length,2);assert.match(calls[0].system,/Självständig svensk copy/);assert.match(calls[1].system,/redaktör/);
  assert.match(calls[1].input,/Bokslut offereras separat/);assert.equal(result.text,output.text);assert.equal(result.initialDraft,'Första utkast');assert.equal(result.findings.length,0);assert.equal(stages.length,2);
});
test('editor failure never returns an unreviewed success',async()=>{
  let calls=0;
  await assert.rejects(()=>writeCopy(brief,library,new AbortController().signal,()=>{},async()=>{if(++calls===2)throw new Error('provider failed');return{output,id:'fixture',inputTokens:0,outputTokens:0};}),/provider failed/);
});
test('brief validation rejects impossible formats, oversized data and empty revision sources',()=>{
  for(const change of [{mode:'revise',sourceText:''},{channel:'unknown'},{facts:'x'.repeat(5001)},{task:'short'},{unknown:'key'}])assert.equal(studioInput.safeParse({...brief,...change}).success,false);
});
test('public routes cannot invoke AI, create accounts or subscribe while access is deferred',async()=>{
  const server=createApp(library).listen(0,'127.0.0.1');await once(server,'listening');
  const base='http://127.0.0.1:'+(server.address() as AddressInfo).port;
  try{
    const post=(path:string,body:unknown,origin='https://sigge.si')=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)});
    assert.equal((await post('/api/write',brief)).status,503);
    assert.equal((await post('/api/write',brief,'https://attacker.example')).status,503);
    assert.equal((await post('/api/auth/sign-up/email',{email:'x@example.com',password:'password'})).status,404);
    assert.equal((await post('/api/fieldnotes',{consent:true})).status,404);
    assert.equal((await post('/api/fieldnotes',{consent:false})).status,404);
    assert.deepEqual(await(await fetch(base+'/api/account')).json(),{user:null});
    assert.equal((await fetch(base+'/library')).status,200);
    assert.equal((await fetch(base+'/people')).status,200);
    const kit=await (await fetch(base+'/api/writing-kit')).json();
    assert.equal(kit.people.length,59);assert.equal(kit.frameworks.length,11);
    assert.equal((await fetch(base+'/.env.local')).status,404);
  }finally{await new Promise<void>(r=>server.close(()=>r()));}
});
