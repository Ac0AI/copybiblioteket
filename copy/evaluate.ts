import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT, loadCopyLibrary } from './library.js';
import { studioInput, writeCopy } from './studio.js';
const library=await loadCopyLibrary(ROOT,false);
const cases=JSON.parse(await readFile(join(ROOT,'evaluations/briefs.json'),'utf8'));
const selected=process.argv[2]?cases.filter((c: {id:string})=>c.id===process.argv[2]):cases;
await mkdir(join(ROOT,'evaluations/results'),{recursive:true});
for(const {id,...brief} of selected){
  const start=Date.now();
  try{
    const result=await writeCopy(studioInput.parse(brief),library,AbortSignal.timeout(140000),(stage)=>console.log(id+': '+stage));
    await writeFile(join(ROOT,'evaluations/results',id+'.json'),JSON.stringify({id,checkedAt:new Date().toISOString(),durationMs:Date.now()-start,brief,result},null,2)+'\n');
    console.log(JSON.stringify({id,seconds:Math.round((Date.now()-start)/1000),findings:result.findings.length,usage:result.usage}));
  }catch(error){console.error(id+': '+(error instanceof Error?error.message:'Error'));process.exitCode=1;}
}
