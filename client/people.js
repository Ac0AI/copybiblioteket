import {language,t,route,apiPath,onLanguageChange} from './i18n.js';
import portraits from '../data/portraits.json';
const $=id=>document.getElementById(id);
const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
let people=[],current=null,latest=0;
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function portrait(person,detail=false){
  const frame=el('span');frame.className='person-portrait';frame.setAttribute('aria-hidden','true');
  const parts=person.name.split(/\s+/).filter(Boolean);
  const initials=[parts[0],...(parts.length>1?[parts.at(-1)]:[])].map(part=>part.replace(/[^\p{L}]/gu,'').slice(0,1)).join('');
  const fallback=el('span',initials);fallback.className='portrait-fallback';frame.append(fallback);
  const photo=portraits[person.id];
  if(photo){
    if(photo.kind==='avatar')frame.classList.add('portrait-avatar');
    const img=el('img');img.alt='';img.width=photo.width;img.height=photo.height;
    img.loading=detail?'eager':'lazy';img.decoding='async';
    img.addEventListener('error',()=>img.remove(),{once:true});
    img.src=photo.src;frame.append(img);
  }
  return frame;
}
function showPortrait(person){
  $('person-photo').replaceChildren(portrait(person,true));
  const credit=$('portrait-credit'),photo=portraits[person.id];credit.replaceChildren();
  if(!photo)return;
  const source=el('a',t('portraitSource')+' ↗');source.href=photo.sourceUrl;source.target='_blank';source.rel='noopener noreferrer';credit.append(source);
  if(photo.license){
    credit.append(document.createTextNode(' · '+photo.credit+' · '));
    const license=el('a',photo.license);license.href=photo.licenseUrl;license.target='_blank';license.rel='noopener noreferrer';credit.append(license);
    credit.append(document.createTextNode(' · '+t('portraitCrop')));
  }else{
    credit.append(document.createTextNode(' · '+t('portraitVia')+' '));
    const catalog=el('a','The Brains');catalog.href=photo.catalogUrl;catalog.target='_blank';catalog.rel='noopener noreferrer';credit.append(catalog);
  }
}
function render(){
  const words=normalize($('people-search').value).trim().split(/\s+/).filter(Boolean),category=$('people-category').value;
  const filtered=people.filter(p=>(!category||p.category===category)&&words.every(w=>normalize([p.name,p.summary,t(p.category),...p.topics,...p.principles].join(' ')).includes(w)));
  $('people-list').replaceChildren();$('people-count').removeAttribute('data-i18n');$('people-count').textContent=t('peopleCount',{count:filtered.length,total:people.length});$('people-empty').hidden=Boolean(filtered.length);
  for(const person of filtered){
    const button=el('button');button.type='button';button.className='person-card';
    const content=el('div');content.className='person-copy';
    const category=el('span',t(person.category));category.className='person-category';
    const title=el('h2',person.name),arrow=el('span','↗');arrow.setAttribute('aria-hidden','true');title.append(arrow);
    content.append(category,title,el('p',person.summary));button.append(portrait(person),content);
    button.addEventListener('click',()=>openPerson(person.id));$('people-list').append(button);
  }
}
function section(title,items){const box=el('section');box.className='person-section';box.append(el('h3',title));const ul=el('ul');items.forEach(text=>ul.append(el('li',text)));box.append(ul);$('person-detail').append(box);return box;}
function openPerson(id){
  const p=people.find(p=>p.id===id);if(!p)return;current=p;
  $('person-name').textContent=p.name;$('person-category').textContent=t(p.category);$('person-summary').textContent=p.summary;$('person-detail').replaceChildren();
  showPortrait(p);
  section(t('ownApplications'),p.principles);section(t('questions'),p.questions);
  const box=section(t('inheritedSources'),[]);box.querySelector('ul').remove();const note=el('p',t('sourceNote'));note.className='source-note';box.append(note);
  const ul=el('ul');for(const source of p.sources){const li=el('li'),a=el('a',source.title+' ↗');a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';li.append(a);ul.append(li);}box.append(ul);
  $('use-person').href=route('/')+'?perspective='+encodeURIComponent(p.id);$('copy-status').textContent='';history.replaceState(null,'','#'+p.id);if(!$('person-dialog').open)$('person-dialog').showModal();
}
$('people-search').addEventListener('input',render);$('people-category').addEventListener('change',render);
$('close-person').addEventListener('click',()=>$('person-dialog').close());
$('person-dialog').addEventListener('close',()=>history.replaceState(null,'',location.pathname+location.search));
$('copy-person').addEventListener('click',async()=>{
  if(!current)return;const p=current;
  const text=[p.name+' — '+p.summary,t('sourceNote'),...p.principles,t('questions')+':',...p.questions,t('inheritedSources')+':',...p.sources.map(s=>s.title+'\n'+s.url),t('personPrompt')].join('\n\n');
  try{await navigator.clipboard.writeText(text);$('copy-status').textContent=t('personCopied');}catch{$('copy-status').textContent=t('copyBlocked');}
});
const openHash=()=>{try{if(location.hash)openPerson(decodeURIComponent(location.hash.slice(1)));}catch{}};
window.addEventListener('hashchange',openHash);
async function load(){
  const request=++latest;
  try{
    const response=await fetch(apiPath('/api/people'));if(!response.ok)throw Error();const data=await response.json();if(request!==latest)return;
    people=data.people.sort((a,b)=>a.name.localeCompare(b.name,language));
    const previous=$('people-category').value,all=el('option',t('allAreas'));all.value='';$('people-category').replaceChildren(all);
    for(const category of [...new Set(people.map(p=>p.category))].sort((a,b)=>t(a).localeCompare(t(b),language))){const option=el('option',t(category));option.value=category;$('people-category').append(option);}
    $('people-category').value=previous;render();openHash();
  }catch{if(request===latest){$('people-count').removeAttribute('data-i18n');$('people-count').textContent=t('loadError');}}
}
onLanguageChange(load);load();
