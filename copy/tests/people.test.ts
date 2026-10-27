import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCopyLibrary} from '../library.js';
import {profileSchema} from '../schema.js';
import {buildWritingPrompt,selectPerspectives} from '../brief.js';
const library=await loadCopyLibrary(undefined,false);
const brief={task:'Skriv ett LinkedIn-inlägg om en bokföringsbyrå.',audience:'Egenföretagare',channel:'linkedin',length:'kort',tone:'Torr humor',voice:'Här är vårt stilprov.',facts:'995 kr/mån exkl. moms.',mustKeep:'Bokslut offereras separat.',perspective:'justin-welsh'};

test('all 59 distinct profiles are available with source provenance and safe links',()=>{
  assert.equal(library.people.length,59);
  assert.equal(new Set(library.people.map(p=>p.id)).size,59);
  for(const person of library.people){assert.equal(person.provenance.sourceStatus,'inherited-unverified');assert.ok(person.sources.length);assert.equal(library.searchPeople(person.name,1).results[0]?.id,person.id,person.name);}
  assert.equal(profileSchema.safeParse({...library.people[0],sources:[{title:'Bad',url:'javascript:alert(1)'}]}).success,false);
});
test('explicit profile choice wins over topic routing and facts survive the exported prompt',()=>{
  const kit={frameworks:library.frameworks,people:library.people,guide:library.writingGuide};
  const result=buildWritingPrompt({...brief,sourceText:'Här är en befintlig text.',instruction:'Behåll humorn.'},kit);
  assert.deepEqual(result.people.map(p=>p.id),['justin-welsh']);
  for(const text of [brief.facts,brief.mustKeep,brief.voice,'Här är en befintlig text.','Behåll humorn.'])assert.ok(result.prompt.includes(text));
  assert.match(result.prompt,/inte självständigt verifierade/);
  assert.match(result.prompt,/Röstprov visar stil, inte produktfakta/);
});
test('automatic routing is bounded and does not turn health or motivation profiles into copy evidence',()=>{
  const people=selectPerspectives({...brief,perspective:'',task:'En text om fokus och motivation'},library.people);
  assert.ok(people.length<=3);assert.ok(people.every(p=>p.category!=='Fördjupning'));
  assert.deepEqual(selectPerspectives({...brief,perspective:'socrates'},library.people).map(p=>p.id),['socrates']);
  assert.deepEqual(selectPerspectives({...brief,perspective:'not-a-profile'},library.people),[]);
});
