import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { loadCopyLibrary } from '../library.js';
import { buildWritingPrompt } from '../brief.js';
import { createApp } from '../http.js';

const sv=await loadCopyLibrary(undefined,false),en=sv.forLanguage('en');
test('English catalogue is complete and preserves identities, sources and provenance',()=>{
  assert.equal(en.language,'en');assert.equal(en.forLanguage('sv'),sv);
  assert.equal(en.frameworks.length,11);assert.equal(en.people.length,59);
  for(const p of sv.people){const translated=en.getPerson(p.id)!;assert.equal(translated.name,p.name);assert.notEqual(translated.summary,p.summary);assert.deepEqual(translated.sources,p.sources);assert.deepEqual(translated.provenance,p.provenance);assert.equal(en.searchPeople(p.name,1).results[0]?.id,p.id);}
  for(const f of sv.frameworks){const translated=en.get(f.id)!;assert.equal(translated.language,'en');assert.notEqual(translated.summary,f.summary);assert.deepEqual(translated.sources,f.sources);assert.equal(translated.principles.length,f.principles.length);assert.equal(translated.questions.length,f.questions.length);}
  assert.equal(en.search('trust and testimonials',1).results[0]?.id,'cialdini-persuasion');
  assert.equal(en.search('positioning differentiation alternatives',1).results[0]?.id,'dunford-positioning');
});
test('English writing and revision keep exact user data and never inject a Swedish writing instruction',()=>{
  const brief={language:'en' as const,task:'Write a web page about price and value',audience:'English-speaking business owners in Sweden',channel:'webb',length:'kort',tone:'Dry humour',voice:'Our sample, not product facts.',facts:'995 kr/mån exkl. moms. No currency conversion.',mustKeep:'Bokslut offereras separat.',perspective:'alex-hormozi',sourceText:'An existing draft with a £20 charge.',instruction:'Keep the exact terms.'};
  const {prompt,frameworks,people}=buildWritingPrompt(brief,{frameworks:en.frameworks,people:en.people,guide:en.writingGuide,language:'en'});
  assert.match(prompt,/Write directly in English/);assert.match(prompt,/ENGLISH WRITING GUIDE/);assert.doesNotMatch(prompt,/Skriv direkt på svenska|SVENSK SKRIVGUIDE/);
  assert.ok(frameworks.every(f=>f.id!=='swedish-original'));assert.deepEqual(people.map(p=>p.id),['alex-hormozi']);
  for(const value of [brief.facts,brief.mustKeep,brief.voice,brief.sourceText,brief.instruction])assert.ok(prompt.includes(value));
  assert.match(prompt,/"channel": "web page"/);assert.match(prompt,/required wording exactly/);
  assert.throws(()=>buildWritingPrompt(brief,{frameworks:sv.frameworks,people:sv.people,guide:sv.writingGuide,language:'sv'}),/does not match/);
});
test('both languages work without account configuration and the public AI route remains disabled',async()=>{
  const server=createApp(sv).listen(0,'127.0.0.1');await once(server,'listening');const base='http://127.0.0.1:'+(server.address() as AddressInfo).port;
  try{
    for(const language of ['sv','en']){
      const prefix=language==='en'?'/en':'';
      for(const path of ['/','/library','/people']){
        const response=await fetch(base+prefix+path),html=await response.text();assert.equal(response.status,200);assert.match(html,new RegExp('<html lang="'+language+'">'));assert.ok(html.includes('https://sigge.si'+prefix+path));assert.doesNotMatch(html,/\{\{/);assert.match(html,/hreflang="en"/);
        if(language==='en')assert.match(html,/Workshop/);
      }
      const kit=await (await fetch(base+'/api/writing-kit?lang='+language)).json();assert.equal(kit.language,language);assert.equal(kit.people.length,59);assert.equal(kit.frameworks.length,11);
      const search=await fetch(base+'/api/search?lang='+language,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:language==='en'?'trust and testimonials':'förtroende och kundomdömen'})});const data=await search.json();assert.equal(data.language,language);assert.equal(data.results[0].id,'cialdini-persuasion');
      assert.equal((await fetch(base+'/api/write?lang='+language,{method:'POST'})).status,503);assert.equal((await fetch(base+'/api/auth/signin?lang='+language,{method:'POST'})).status,404);assert.equal((await fetch(base+'/api/fieldnotes?lang='+language,{method:'POST'})).status,404);
    }
    assert.equal((await fetch(base+'/api/people?lang=de')).status,400);
    assert.equal((await fetch(base+'/api/people?lang=en&lang=sv')).status,400);
    assert.deepEqual(await (await fetch(base+'/api/connection')).json(),{enabled:false,mcpURL:null});
    assert.equal((await fetch(base+'/mcp',{method:'POST'})).status,503);
    for(const asset of ['/studio-app.js','/library.js','/people.js','/connect.js','/connect.css','/navigation.css'])assert.equal((await fetch(base+asset)).status,200);
  }finally{await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
});
