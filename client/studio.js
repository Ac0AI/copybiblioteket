import { buildWritingPrompt } from '../copy/brief.ts';

const $ = (id) => document.getElementById(id);
const fields = ['task','audience','channel','length','tone','voice','facts','mustKeep','perspective'];
const storageKey = 'sigge-workspace-v1';
let kit = null, result = null, versions = [];
const example = {
  task:'Skriv en kort inledning till en webbsida för Räkna, en påhittad bokföringsbyrå. Målet är att småföretagaren bokar ett första samtal för att se om tjänsten passar.',
  audience:'Egenföretagare som gör bokföringen på kvällarna och vill lämna över det löpande arbetet, men oroar sig för kostnaden.',
  channel:'webb',length:'kort',tone:'Varm, konkret och lättsam. En liten glimt i ögat, utan att förminska läsaren.',
  voice:'Du startade företag för din idé. Vi gissar att kontering inte var själva idén.\nRaka besked. Också när svaret är ”det beror på”.',
  facts:'Räkna är en påhittad bokföringsbyrå.\nLöpande bokföring kostar från 995 kr/mån exkl. moms.\nEn personlig kontakt ingår.\nBokslut och deklaration offereras separat.\nDet första samtalet är kostnadsfritt och utan förpliktelser.',
  mustKeep:'Bokslut och deklaration offereras separat.',
};
const exampleText='Företaget är ditt. Kvällarna också.\n\nDu startade nog inte eget för att få mer bokföring att göra. Låt Räkna ta hand om den löpande bokföringen, med en personlig kontakt att fråga när du kör fast.\n\nFrån 995 kr/mån exkl. moms. Bokslut och deklaration offereras separat.\n\nBoka ett första samtal. Det kostar inget och du förbinder dig inte till något.';
const el = (tag, text, className) => { const node = document.createElement(tag); if (text) node.textContent = text; if (className) node.className = className; return node; };
function notify(message, error = false) { $('notice').textContent=message; $('notice').hidden=!message; $('notice').className='notice'+(error?' error':''); }
function brief() { return Object.fromEntries(fields.map((id) => [id,$(id).value])); }
function fill(data) { for (const id of fields) if (typeof data[id] === 'string') $(id).value = data[id]; }
function showDocument() { $('empty-state').hidden=true; $('document').hidden=false; }
function updateDocument() {
  const text=$('document').value.trim(); $('word-count').textContent=(text?text.split(/\s+/u).length:0)+' ord';
  for (const id of ['copy-text','download-text','revise-button']) $(id).disabled=!text;
  if (text) showDocument();
  if (result && result.text !== $('document').value) $('editor-intro').textContent='Du har ändrat texten efter granskningen. Anteckningarna gäller den tidigare versionen.';
  save();
}
function save() {
  if (!$('remember').checked) return;
  try { localStorage.setItem(storageKey,JSON.stringify({ brief:brief(),text:$('document').value,result,versions:versions.slice(-12) })); }
  catch { notify('Webbläsaren kunde inte spara arbetet. Ladda ned texten för att behålla den.',true); }
}
function restore() {
  try { const data=JSON.parse(localStorage.getItem(storageKey)||'null'); if(!data)return;
    fill(data.brief||{}); $('document').value=typeof data.text==='string'?data.text:''; result=data.result||null; versions=Array.isArray(data.versions)?data.versions.slice(-12):[];
    $('remember').checked=true; renderNotes(); renderVersions(); updateDocument();
  } catch { notify('Det sparade arbetet kunde inte läsas. Du kan börja om eller radera den lokala kopian.',true); }
}
function snapshot(label) { if(!$('document').value.trim())return; versions.push({label,time:new Date().toISOString(),text:$('document').value,brief:brief(),result}); versions=versions.slice(-12); renderVersions(); }
function renderVersions() {
  $('version-panel').hidden=!versions.length; $('version-count').textContent=String(versions.length); $('versions').replaceChildren();
  versions.slice().reverse().forEach((version) => { const row=el('div',null,'version-row'); const time=new Date(version.time).toLocaleTimeString('sv-SE',{hour:'2-digit',minute:'2-digit'}); row.append(el('span',`${version.label} · ${time}`)); const button=el('button','Återställ','text-button'); button.type='button'; button.addEventListener('click',()=>{  snapshot('Före återställning'); fill(version.brief); $('document').value=version.text; result=version.result; renderNotes(); updateDocument(); notify('Versionen och dess brief har återställts.'); }); row.append(button); $('versions').append(row); });
}
function section(title) { const box=el('section',null,'note-section'); box.append(el('h3',title)); $('editor-notes').append(box); return box; }
function list(parent,items,className) { const ul=el('ul'); for(const text of items)ul.append(el('li',text,className)); parent.append(ul); }
function renderNotes() {
  $('editor-notes').replaceChildren();
  if(!result){ $('editor-intro').textContent='Här ser du hur exemplet är uppbyggt. Skrivunderlaget väljer ramverk och perspektiv för ditt eget uppdrag.'; return; }
  $('editor-intro').textContent=result.demo?'Ett redaktionellt exempel med påhittat företag. Ingen AI-körning har gjorts.':'Modellgranskning utifrån ditt underlag. Läs igenom innan du använder texten.';
  if(result.findings?.length)list(section('Kontrollera före användning'),result.findings.map((f)=>f.text),'findings');
  section('Det valda argumentet').append(el('p',result.angle));
  if(result.headlines?.length){ const box=section('Andra öppningar'); box.append(el('p','Klicka för att kopiera en öppning.')); for(const text of result.headlines){const button=el('button',text,'headline-option');button.type='button';button.addEventListener('click',()=>copy(text,'Öppningen är kopierad.'));box.append(button);} }
  if(result.questions?.length)list(section('Det behöver du avgöra'),result.questions);
  if(result.changes?.length)list(section('Redaktörens ändringar'),result.changes);
  if(result.claims?.length){const box=section('Påståenden och underlag'); for(const claim of result.claims){const item=el('div',null,'fact-claim');item.append(el('p',`”${claim.quote}”`));const matches=claim.factIds.map((id)=>result.facts?.find((f)=>f.id===id)?.text).filter(Boolean);item.append(el('small',matches.length?matches.join(' · '):'Saknar kopplat faktaunderlag.'));box.append(item);} }
  if(result.frameworks?.length){const box=section('Ramverk som hjälpte');for(const f of result.frameworks){const a=el('a',f.id.replaceAll('-',' '));a.href=(kit?.people.some(p=>p.id===f.id)?'/people#':'/library#')+encodeURIComponent(f.id);box.append(a,el('p',f.application));} }
}
async function copy(text,message='Texten är kopierad.') {try{await navigator.clipboard.writeText(text);notify(message);return true;}catch{notify('Kopieringen blockerades. Markera texten och kopiera manuellt.',true);return false;}}
async function json(url,options) {const r=await fetch(url,options);const data=await r.json();if(!r.ok)throw new Error(data.error||data.message||'Något gick fel. Försök igen.');return data;}
async function run(mode) {
  if(!$('brief').reportValidity())return;
  if(mode==='revise'&&!$('document').value.trim())return;
  if(!kit){notify('Biblioteket kunde inte läsas. Ladda om sidan och försök igen.',true);return;}
  const data=buildWritingPrompt({...brief(),sourceText:mode==='revise'?$('document').value:'',instruction:mode==='revise'?$('instruction').value:''},kit);
  $('prompt-text').value=data.prompt;
  $('prompt-context').textContent=[...data.frameworks.map(f=>f.title),...data.people.map(p=>p.name)].join(' · ');
  $('prompt-copy-status').textContent='';$('prompt-dialog').showModal();
}
$('brief').addEventListener('submit',(e)=>{e.preventDefault();run('write');});
$('revise-form').addEventListener('submit',(e)=>{e.preventDefault();run('revise');});
$('document').addEventListener('input',updateDocument);for(const id of fields)$(id).addEventListener('input',save);
$('start-pasting').addEventListener('click',()=>{showDocument();$('document').focus();});
$('copy-text').addEventListener('click',()=>copy($('document').value));
$('download-text').addEventListener('click',()=>{const blob=new Blob([$ ('document').value],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=el('a');a.href=url;a.download='sigge-text.txt';document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);notify('Texten har laddats ned.');});
for(const button of document.querySelectorAll('[data-revise]'))button.addEventListener('click',()=>{$('instruction').value=button.dataset.revise;$('instruction').focus();});
$('remember').addEventListener('change',()=>{if($('remember').checked)save();else{try{localStorage.removeItem(storageKey);}catch{}notify('Lokal lagring avstängd. Arbetet finns kvar så länge sidan är öppen.');}});
$('clear-saved').addEventListener('click',()=>{try{localStorage.removeItem(storageKey);}catch{}$('remember').checked=false;notify('Den sparade kopian är raderad. Texten på skärmen finns kvar.');});
$('new-document').addEventListener('click',()=>{snapshot('Före nytt dokument');$('brief').reset();$('document').value='';result=null;$('empty-state').hidden=false;$('document').hidden=true;renderNotes();updateDocument();notify('Ett nytt uppdrag. Tidigare text finns under Versioner.');$('task').focus();});
$('load-example').addEventListener('click',()=>{snapshot('Före exemplet');fill(example);$('document').value=exampleText;result={demo:true,text:exampleText,angle:'Läsaren vill lämna över bokföringen och förstå vad det kostar. Öppningen tar fasta på kvällarna, sedan kommer tjänsten, priset och avgränsningen.',headlines:['Bokföring att lämna över. En kontakt att fråga.','Du har en affärsidé. Vi tar bokföringen.','Låt inte bokföringen få hela kvällen.'],questions:[],changes:['Villkoret om bokslut och deklaration står nära priset.','Nästa steg beskriver ett första samtal, utan att lova ett resultat.'],claims:[{quote:'Från 995 kr/mån exkl. moms.',factIds:['F2']}],facts:[{id:'F2',text:'Löpande bokföring kostar från 995 kr/mån exkl. moms.'}],frameworks:[{id:'hormozi-offer',application:'Visar nytta, pris och vad som faktiskt ingår.'},{id:'swedish-original',application:'Använder röstprovets lättsamma tilltal och skriver från läsarens situation.'}]};renderNotes();updateDocument();notify('Påhittat exempel. Ändra briefen eller skapa ett eget skrivunderlag.');});
$('about-button').addEventListener('click',()=>$('privacy-dialog').showModal());
$('copy-prompt').addEventListener('click',async()=>{const ok=await copy($('prompt-text').value,'Skrivunderlaget är kopierat. Klistra in det i din AI-chatt.');$('prompt-copy-status').textContent=ok?'Kopierat. Klistra in underlaget i din AI-chatt.':'Markera underlaget och kopiera manuellt.';});
for(const button of document.querySelectorAll('.close-dialog'))button.addEventListener('click',()=>{button.closest('dialog').close();});
for(const id of ['privacy-button','about-privacy'])$(id).addEventListener('click',()=>$('privacy-dialog').showModal());
$('privacy-dialog').querySelector('.close-privacy').addEventListener('click',()=>$('privacy-dialog').close());
$('privacy-contact').append(document.createTextNode('Sigge drivs av AC0 AI SLU. För frågor om Sigge: '));const contact=el('a','hi@ac0.ai');contact.href='mailto:hi@ac0.ai';$('privacy-contact').append(contact,document.createTextNode('.'));
restore();
try{
  kit=await json('/api/writing-kit');
  for(const person of kit.people){const option=el('option',person.name+' — '+person.summary);option.value=person.id;$('perspective').append(option);}
  const selected=new URLSearchParams(location.search).get('perspective');
  if(selected&&kit.people.some(p=>p.id===selected))$('perspective').value=selected;
  else{try{const stored=JSON.parse(localStorage.getItem(storageKey)||'null');if(stored?.brief?.perspective)$('perspective').value=stored.brief.perspective;}catch{}}
}catch{notify('Biblioteket kunde inte läsas. Du kan fortfarande redigera och ladda ned din text.',true);}
