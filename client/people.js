import {language,t,route,apiPath,onLanguageChange} from './i18n.js';
import portraits from '../data/portraits.json';
const $=id=>document.getElementById(id);
const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
let people=[],latest=0;
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function portrait(person,detail=false){
  const frame=el('span');frame.className='person-portrait';frame.setAttribute('aria-hidden','true');
  const parts=person.name.replace(/\(.*?\)/g,'').split(/\s+/).filter(Boolean);
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
function render(){
  const words=normalize($('people-search').value).trim().split(/\s+/).filter(Boolean),category=$('people-category').value;
  const filtered=people.filter(p=>(!category||p.category===category)&&words.every(w=>normalize([p.name,p.summary,t(p.category),...p.topics,...p.principles].join(' ')).includes(w)));
  $('people-list').replaceChildren();$('people-count').removeAttribute('data-i18n');$('people-count').textContent=t('peopleCount',{count:filtered.length,total:people.length});$('people-empty').hidden=Boolean(filtered.length);
  for(const person of filtered){
    const button=el('a');button.href=route('/people/'+person.id);button.className='person-card';
    const content=el('div');content.className='person-copy';
    const category=el('span',t(person.category));category.className='person-category';
    const title=el('h2',person.name),arrow=el('span','↗');arrow.setAttribute('aria-hidden','true');title.append(arrow);
    content.append(category,title,el('p',person.summary));button.append(portrait(person),content);
    $('people-list').append(button);
  }
}
$('people-search').addEventListener('input',render);$('people-category').addEventListener('change',render);
// Profiles have their own pages; links to the old dialog (#id) are forwarded there.
const openHash=()=>{try{const id=decodeURIComponent(location.hash.slice(1));if(people.some(p=>p.id===id))location.replace(route('/people/'+id));}catch{}};
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
// A slow wall of portraits sets the scene; it is decorative and hidden from assistive technology.
function renderWall(){
  const photos=Object.values(portraits).filter(photo=>photo.kind!=='avatar'),wall=$('portrait-wall');if(!wall)return;
  const columns=[0,1,2].map(()=>el('div'));
  photos.slice(0,18).forEach((photo,i)=>{const img=el('img');img.src=photo.src;img.alt='';img.width=photo.width;img.height=photo.height;img.decoding='async';columns[i%3].append(img);});
  for(const column of columns){column.className='wall-column';column.append(...[...column.children].map(node=>node.cloneNode()));wall.append(column);}
}
renderWall();
onLanguageChange(load);load();
