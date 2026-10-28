import { buildWritingPrompt } from '../copy/brief.ts';
import { language, t, route, apiPath, onLanguageChange } from './i18n.js';
import { examples, revisionInstructions } from './examples.js';

const $ = id => document.getElementById(id);
const fields = ['task','audience','channel','length','tone','voice','facts','mustKeep','perspective','language'];
const storageKey = 'sigge-workspace-v1';
const kits = new Map();
let kit = null, displayKit = null, result = null, versions = [], pendingPerspective = '', languageChosen = false, latestLoad = 0;
const el = (tag,text,className) => {const node=document.createElement(tag);if(text)node.textContent=text;if(className)node.className=className;return node;};
const outputLanguage = () => $('language').value === 'en' ? 'en' : 'sv';
function notify(message,error=false) {$('notice').textContent=message;$('notice').hidden=!message;$('notice').className='notice'+(error?' error':'');}
function brief() {return Object.fromEntries(fields.map(id=>[id,id==='perspective'?pendingPerspective:$(id).value]));}
function fill(data) {
  for (const id of fields) if (typeof data[id] === 'string') $(id).value=data[id];
  if (typeof data.perspective === 'string') pendingPerspective=data.perspective;
  if (!data.language) $('language').value='sv'; // Saved v1 briefs were Swedish.
}
function showDocument() {$('empty-state').hidden=true;$('document').hidden=false;}
function updateReadyNote() {
  $('quota-note').removeAttribute('data-i18n');
  $('quota-note').textContent=t(kit?'readyNote':'loading',{language:t(outputLanguage()==='en'?'languageEn':'languageSv')});
  const person=displayKit?.people.find(p=>p.id===pendingPerspective);
  $('selected-perspective').hidden=!person;
  $('selected-perspective').textContent=person ? t('perspective')+': '+person.name : '';
}
function updateDocument() {
  const text=$('document').value.trim();
  $('word-count').textContent=t('words',{count:text?text.split(/\s+/u).length:0});
  $('document').lang=outputLanguage();
  for (const id of ['copy-text','download-text']) $(id).disabled=!text;
  $('revise-button').disabled=!text||!kit;
  if (text) showDocument();
  $('editor-intro').removeAttribute('data-i18n');
  $('editor-intro').textContent=t(!result?.demo?'notesEmpty':result.text!==$('document').value?'notesEdited':'notesDemo');
  save();
}
function save() {
  if (!$('remember').checked) return;
  try {localStorage.setItem(storageKey,JSON.stringify({brief:brief(),languageChosen,text:$('document').value,result,versions:versions.slice(-12)}));}
  catch {notify(t('saveError'),true);}
}
function restore() {
  try {
    const data=JSON.parse(localStorage.getItem(storageKey)||'null');if(!data)return;
    fill(data.brief||{});languageChosen=data.languageChosen??true;
    $('document').value=typeof data.text==='string'?data.text:'';result=data.result||null;versions=Array.isArray(data.versions)?data.versions.slice(-12):[];
    $('remember').checked=true;
  } catch {notify(t('restoreError'),true);}
}
function snapshot(label) {
  if (!$('document').value.trim()) return;
  versions.push({labelKey:label,time:new Date().toISOString(),text:$('document').value,brief:brief(),result});versions=versions.slice(-12);renderVersions();
}
function renderVersions() {
  $('version-panel').hidden=!versions.length;$('version-count').textContent=String(versions.length);$('versions').replaceChildren();
  for (const version of versions.slice().reverse()) {
    const row=el('div',null,'version-row');
    const time=new Date(version.time).toLocaleTimeString(language==='en'?'en-GB':'sv-SE',{hour:'2-digit',minute:'2-digit'});
    row.append(el('span',`${version.labelKey?t(version.labelKey):version.label} · ${time}`));
    const button=el('button',t('restore'),'text-button');button.type='button';
    button.addEventListener('click',()=>{snapshot('beforeRestore');fill(version.brief);languageChosen=true;$('document').value=version.text;result=version.result;renderNotes();updateDocument();loadKit();notify(t('restored'));});
    row.append(button);$('versions').append(row);
  }
}
function section(title) {const box=el('section',null,'note-section');box.append(el('h3',title));$('editor-notes').append(box);return box;}
function renderNotes() {
  $('editor-notes').replaceChildren();
  // Public notes are exclusively about the prewritten example, never a review of user text.
  if (!result?.demo) return;
  const demo=examples[result.exampleLanguage||'sv'];
  const noteLanguage=result.exampleLanguage||'sv';
  // Keep example commentary in the example's language rather than changing the user's draft.
  $('editor-notes').lang=noteLanguage;
  section(t('angle')).append(el('p',demo.angle));
  const openings=section(t('openings'));openings.append(el('p',t('copyOpening')));
  for(const text of demo.headlines){const button=el('button',text,'headline-option');button.type='button';button.addEventListener('click',()=>copy(text,t('openingCopied')));openings.append(button);}
  const changes=section(t('changes')),ul=el('ul');for(const text of demo.changes)ul.append(el('li',text));changes.append(ul);
  const frameworks=section(t('helpfulFrameworks'));
  for(const f of demo.frameworks){const title=displayKit?.frameworks.find(item=>item.id===f.id)?.title||f.id;const a=el('a',title);a.href=route('/library')+'#'+f.id;frameworks.append(a,el('p',f.application));}
}
async function copy(text,message=t('textCopied')) {try{await navigator.clipboard.writeText(text);notify(message);return true;}catch{notify(t('copyBlocked'),true);return false;}}
function getKit(locale) {
  if (!kits.has(locale)) kits.set(locale,fetch(apiPath('/api/writing-kit',locale)).then(async response=>{if(!response.ok)throw Error();return response.json();}).catch(error=>{kits.delete(locale);throw error;}));
  return kits.get(locale);
}
async function loadKit() {
  const request=++latestLoad;
  kit=null;$('write-button').disabled=true;$('perspective').disabled=true;updateReadyNote();updateDocument();
  try {
    const [writing,display]=await Promise.all([getKit(outputLanguage()),getKit(language)]);
    if (request!==latestLoad) return;
    kit=writing;displayKit=display;
    const automatic=el('option',t('automatic'));automatic.value='';$('perspective').replaceChildren(automatic);
    for(const person of displayKit.people){const option=el('option',person.name+' — '+person.summary);option.value=person.id;$('perspective').append(option);}
    if (!displayKit.people.some(p=>p.id===pendingPerspective)) pendingPerspective='';
    $('perspective').value=pendingPerspective;$('perspective').disabled=false;$('write-button').disabled=false;
    updateReadyNote();renderNotes();updateDocument();
  } catch {
    if(request!==latestLoad)return;
    $('quota-note').textContent=t('loadError');notify(t('editStillWorks'),true);
  }
}
function run(mode) {
  if (!$('brief').reportValidity() || !kit) return;
  if (mode==='revise'&&!$('document').value.trim()) return;
  const data=buildWritingPrompt({...brief(),sourceText:mode==='revise'?$('document').value:'',instruction:mode==='revise'?$('instruction').value:''},kit);
  $('prompt-text').value=data.prompt;$('prompt-text').lang=outputLanguage();
  $('prompt-context').textContent=[...data.frameworks.map(f=>f.title),...data.people.map(p=>p.name)].join(' · ');
  $('prompt-copy-status').textContent='';$('prompt-dialog').showModal();
}
$('brief').addEventListener('submit',event=>{event.preventDefault();run('write');});
$('revise-form').addEventListener('submit',event=>{event.preventDefault();run('revise');});
$('document').addEventListener('input',updateDocument);
for(const id of fields)$(id).addEventListener('input',()=>{if(id==='perspective'){pendingPerspective=$('perspective').value;updateReadyNote();}save();});
$('language').addEventListener('change',()=>{languageChosen=true;loadKit();});
function pasteDraft() {showDocument();$('document').focus();}
$('start-pasting').addEventListener('click',pasteDraft);
$('return-to-draft').addEventListener('click',()=>{$('prompt-dialog').close();pasteDraft();});
$('copy-text').addEventListener('click',()=>copy($('document').value));
$('download-text').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([$('document').value],{type:'text/plain;charset=utf-8'}));const a=el('a');a.href=url;a.download='sigge-text.txt';document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);notify(t('downloaded'));});
for(const button of document.querySelectorAll('[data-revise]'))button.addEventListener('click',()=>{$('instruction').value=revisionInstructions[outputLanguage()][button.dataset.revise];$('instruction').focus();});
$('remember').addEventListener('change',()=>{if($('remember').checked)save();else{try{localStorage.removeItem(storageKey);}catch{}notify(t('storageOff'));}});
$('clear-saved').addEventListener('click',()=>{try{localStorage.removeItem(storageKey);}catch{}$('remember').checked=false;notify(t('storageDeleted'));});
$('new-document').addEventListener('click',()=>{snapshot('beforeNew');$('brief').reset();$('language').value=language;languageChosen=false;pendingPerspective='';$('document').value='';$('instruction').value='';result=null;$('empty-state').hidden=false;$('document').hidden=true;$('more-settings').open=false;$('example-notes').open=false;renderNotes();loadKit();notify(t('newBrief'));$('task').focus();});
$('load-example').addEventListener('click',()=>{snapshot('beforeExample');const demo=examples[language];fill(demo.brief);languageChosen=false;$('document').value=demo.text;result={demo:true,text:demo.text,exampleLanguage:language};renderNotes();loadKit();notify(t('exampleLoaded'));});
for(const id of ['about-button','privacy-button','about-privacy'])$(id).addEventListener('click',()=>$('privacy-dialog').showModal());
$('copy-prompt').addEventListener('click',async()=>{const ok=await copy($('prompt-text').value,t('promptCopied'));$('prompt-copy-status').textContent=t(ok?'promptCopied':'promptManual');});
for(const button of document.querySelectorAll('.close-dialog'))button.addEventListener('click',()=>button.closest('dialog').close());
$('privacy-dialog').querySelector('.close-privacy').addEventListener('click',()=>$('privacy-dialog').close());
onLanguageChange(()=>{
  if(!languageChosen)$('language').value=language;
  notify('');renderVersions();loadKit();
});
$('language').value=language;
restore();
const selected=new URLSearchParams(location.search).get('perspective');
if(selected)pendingPerspective=selected;
renderVersions();renderNotes();loadKit();
