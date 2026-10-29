import { buildWritingPrompt } from '../copy/brief.ts';
import { language, t, apiPath, onLanguageChange } from './i18n.js';
import { examples, revisionInstructions } from './examples.js';
import { films } from './film.js';
import { findSlop } from './slop.js';

// The web workshop is the no-account way in: a brief becomes a writing prompt for any AI chat.
// Connected AI clients use the same knowledge directly over MCP.
const $ = id => document.getElementById(id);
const fields = ['task','audience','channel','length','tone','voice','facts','mustKeep','perspective','language'];
const storageKey = 'sigge-workspace-v1';
const kits = new Map();
let kit = null, displayKit = null, pendingPerspective = '', languageChosen = false, latestLoad = 0, findings = [];
const el = (tag,text,className) => {const node=document.createElement(tag);if(text)node.textContent=text;if(className)node.className=className;return node;};
const outputLanguage = () => $('language').value === 'en' ? 'en' : 'sv';
function notify(message,error=false) {$('notice').textContent=message;$('notice').hidden=!message;$('notice').className='notice'+(error?' error':'');}
function brief() {return Object.fromEntries(fields.map(id=>[id,id==='perspective'?pendingPerspective:$(id).value]));}
function fill(data) {
  for (const id of fields) if (typeof data[id] === 'string') $(id).value=data[id];
  if (typeof data.perspective === 'string') pendingPerspective=data.perspective;
  if (!data.language) $('language').value='sv'; // Saved v1 briefs were Swedish.
}
function updateReadyNote() {
  $('quota-note').removeAttribute('data-i18n');
  $('quota-note').textContent=t(kit?'readyNote':'loading',{language:t(outputLanguage()==='en'?'languageEn':'languageSv')});
  const person=displayKit?.people.find(p=>p.id===pendingPerspective);
  $('selected-perspective').hidden=!person;
  $('selected-perspective').textContent=person ? t('perspective')+': '+person.name : '';
}
// Only the brief is kept, and only when the reader opts in. Older saves also held a draft; it is dropped.
function save() {
  if (!$('remember').checked) return;
  try {localStorage.setItem(storageKey,JSON.stringify({brief:brief(),languageChosen}));}
  catch {notify(t('saveError'),true);}
}
function restore() {
  try {
    const data=JSON.parse(localStorage.getItem(storageKey)||'null');if(!data)return;
    fill(data.brief||{});languageChosen=data.languageChosen??true;$('remember').checked=true;
  } catch {notify(t('restoreError'),true);}
}
async function copy(text,message) {try{await navigator.clipboard.writeText(text);notify(message);return true;}catch{notify(t('copyBlocked'),true);return false;}}
function getKit(locale) {
  if (!kits.has(locale)) kits.set(locale,fetch(apiPath('/api/writing-kit',locale)).then(async response=>{if(!response.ok)throw Error();return response.json();}).catch(error=>{kits.delete(locale);throw error;}));
  return kits.get(locale);
}
async function loadKit() {
  const request=++latestLoad;
  kit=null;$('write-button').disabled=true;$('perspective').disabled=true;updateReadyNote();
  try {
    const [writing,display]=await Promise.all([getKit(outputLanguage()),getKit(language)]);
    if (request!==latestLoad) return;
    kit=writing;displayKit=display;
    const automatic=el('option',t('automatic'));automatic.value='';$('perspective').replaceChildren(automatic);
    for(const person of displayKit.people){const option=el('option',person.name+' — '+person.summary);option.value=person.id;$('perspective').append(option);}
    if (!displayKit.people.some(p=>p.id===pendingPerspective)) pendingPerspective='';
    $('perspective').value=pendingPerspective;$('perspective').disabled=false;$('write-button').disabled=false;
    updateReadyNote();
  } catch {
    if(request!==latestLoad)return;
    $('quota-note').textContent=t('loadError');notify(t('loadError'),true);
  }
}
function run() {
  if (!$('brief').reportValidity() || !kit) return;
  const data=buildWritingPrompt({...brief(),sourceText:'',instruction:''},kit);
  $('prompt-text').value=data.prompt;$('prompt-text').lang=outputLanguage();
  $('prompt-context').textContent=[...data.frameworks.map(f=>f.title),...data.people.map(p=>p.name)].join(' · ');
  $('prompt-copy-status').textContent='';$('prompt-dialog').showModal();
}
// Detect mode: name each pattern with the quoted passage and a fix; never rewrite or score.
function scanSlop() {
  const text=$('check-text').value,list=$('slop-list'),index=language==='en'?1:0;findings=findSlop(text);
  list.replaceChildren();$('slop-report').hidden=false;$('fix-status').textContent='';
  $('slop-title').textContent=findings.length?t('slopFound',{count:findings.length}):t('slopClean');
  $('fix-slop').hidden=!findings.length;$('slop-report').classList.toggle('is-clean',!findings.length);
  for(const finding of findings){
    const item=el('li'),button=el('button',null,'slop-item');button.type='button';
    button.append(el('strong',finding.label[index]),el('q',finding.quote),el('span',finding.fix[index]));
    button.addEventListener('click',()=>{$('check-text').focus();$('check-text').setSelectionRange(finding.start,finding.end);});
    item.append(button);list.append(item);
  }
}
// The fix prompt carries the findings and the text, so any AI chat can make the minimum edit.
function fixPrompt() {
  const text=$('check-text').value,index=/[åäö]/i.test(text)||language==='sv'?0:1,locale=index?'en':'sv';
  return [revisionInstructions[locale].deslop,t('fixFindings'),...findings.map(f=>`- ${f.label[index]}: ”${f.quote}” – ${f.fix[index]}`),t('fixText'),text].join('\n\n');
}
$('check-text').addEventListener('input',()=>{$('scan-slop').disabled=!$('check-text').value.trim();});
$('scan-slop').addEventListener('click',scanSlop);
$('fix-slop').addEventListener('click',async()=>{const ok=await copy(fixPrompt(),t('fixCopied'));$('fix-status').textContent=t(ok?'fixCopied':'promptManual');});
$('brief').addEventListener('submit',event=>{event.preventDefault();run();});
for(const id of fields)$(id).addEventListener('input',()=>{if(id==='perspective'){pendingPerspective=$('perspective').value;updateReadyNote();}save();});
$('language').addEventListener('change',()=>{languageChosen=true;loadKit();});
$('remember').addEventListener('change',()=>{if($('remember').checked)save();else{try{localStorage.removeItem(storageKey);}catch{}notify(t('storageOff'));}});
$('new-document').addEventListener('click',()=>{$('brief').reset();$('language').value=language;languageChosen=false;pendingPerspective='';$('more-settings').open=false;save();loadKit();notify(t('newBrief'));$('task').focus();});
$('load-example').addEventListener('click',()=>{fill(examples[language].brief);languageChosen=false;save();loadKit();notify(t('exampleLoaded'));});
$('privacy-button').addEventListener('click',()=>$('privacy-dialog').showModal());
$('copy-prompt').addEventListener('click',async()=>{const ok=await copy($('prompt-text').value,t('promptCopied'));$('prompt-copy-status').textContent=t(ok?'promptCopied':'promptManual');});
for(const button of document.querySelectorAll('.close-dialog'))button.addEventListener('click',()=>button.closest('dialog').close());
$('privacy-dialog').querySelector('.close-privacy').addEventListener('click',()=>$('privacy-dialog').close());
onLanguageChange(()=>{
  if(!languageChosen)$('language').value=language;
  notify('');loadKit();if(!$('slop-report').hidden)scanSlop();
});
$('language').value=language;
restore();
const selected=new URLSearchParams(location.search).get('perspective');
if(selected)pendingPerspective=selected;
loadKit();films();
