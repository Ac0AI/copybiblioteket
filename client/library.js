import {t,route,apiPath,onLanguageChange} from './i18n.js';
const $=selector=>document.querySelector(selector);
const list=$('#framework-list'),detail=$('#detail'),status=$('#status');
let all=[],activeId='',latestRequest=0,latestLoad=0;
function element(tag,text,className){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;}
function link(title,url){const node=element('a',title);if(new URL(url).protocol!=='https:')return element('span',title);node.href=url;node.target='_blank';node.rel='noopener noreferrer';return node;}
async function request(path,body){const response=await fetch(apiPath(path),body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});const data=await response.json();if(!response.ok)throw new Error(data.error||t('loadError'));return data;}
function setActive(id){activeId=id;for(const button of list.querySelectorAll('button'))button.setAttribute('aria-current',String(button.dataset.id===id));}
function renderList(frameworks,heading){
  $('#list-heading').removeAttribute('data-i18n');$('#list-heading').textContent=heading;list.replaceChildren();
  for(const f of frameworks){const button=element('button',undefined,'framework-button');button.type='button';button.dataset.id=f.id;button.append(element('strong',f.title),element('span',f.author));button.setAttribute('aria-current',String(f.id===activeId));button.addEventListener('click',()=>selectFramework(f.id,true));list.append(button);}
}
function subsection(title,text){const section=element('section');section.append(element('h3',title),element('p',text));return section;}
function bulleted(title,items){const section=element('section'),ul=element('ul');for(const item of items)ul.append(element('li',item));section.append(element('h3',title),ul);return section;}
function renderFramework(f){
  setActive(f.id);history.replaceState(null,'','#'+f.id);
  detail.replaceChildren(element('p',f.author+' / '+t(f.category),'author'),element('h2',f.title),element('p',f.summary,'lead'));
  const contexts=element('div',undefined,'context');contexts.append(subsection(t('useWhen'),f.useWhen),subsection(t('avoidWhen'),f.avoidWhen));
  detail.append(contexts,bulleted(t('apply'),f.principles),bulleted(t('questions'),f.questions));
  const example=element('section',undefined,'example');example.append(element('h3',t('exampleHeading')),element('p',f.example.context,'example-context'),element('p',t('draftLabel'),'example-label'),element('blockquote',f.example.before),element('p',t('revised'),'example-label'),element('blockquote',f.example.after,'after'),element('p',f.example.explanation,'explanation'));
  detail.append(example,element('h3',t('sources')));const sources=element('ul',undefined,'source-links');for(const source of f.sources){const li=element('li');li.append(link(source.title,source.url));sources.append(li);}detail.append(sources,element('p',t('exampleNotice'),'note'));
  const copy=element('button',t('copyFramework'),'quiet-button copy-button');copy.type='button';
  copy.addEventListener('click',async()=>{
    const prompt=[t('frameworkPrompt'),f.title,f.summary,t('apply')+':',...f.principles.map(p=>'- '+p),t('questions')+':',...f.questions.map(p=>'- '+p),t('sources')+':',...f.sources.map(s=>s.title+': '+s.url),t('briefTemplate')].join('\n\n');
    try{await navigator.clipboard.writeText(prompt);status.textContent=t('frameworkCopied');}catch{status.textContent=t('copyBlocked');}
  });
  const use=element('a',t('studio')+' ↗','workshop-link');use.href=route('/');detail.append(copy,use);
}
async function selectFramework(id,focus=false){
  const requestId=++latestRequest;
  try{const {framework}=await request('/api/frameworks/'+encodeURIComponent(id));if(requestId!==latestRequest)return;renderFramework(framework);if(focus&&matchMedia('(max-width:680px)').matches)detail.scrollIntoView({behavior:'auto'});}
  catch(error){if(requestId===latestRequest)status.textContent=error.message;}
}
function renderSources(data){
  renderList(all,t('allFrameworks'));setActive('');detail.replaceChildren(element('h2',t('furtherReading')),element('p',data.notice,'note'));
  if(!data.results.length)detail.append(element('p',t('noSources')));
  for(const source of data.results){const section=element('section',undefined,'source-item');section.append(element('p',source.person+(source.date?' / '+source.date:''),'author'),element('h3',source.heading||source.title),element('p',source.text,'source-passage'),link(t('openSource'),source.url));detail.append(section);}detail.append(element('p',data.guidance,'note'));
}
async function search(){
  const query=$('#query').value.trim();if(!query)return reset();if(query.length<2){status.textContent=t('minSearch');return;}
  const scope=document.querySelector('input[name="scope"]:checked').value,requestId=++latestRequest;status.textContent=t('searching');
  try{const body={query,scope,limit:6};if(scope==='sources'&&$('#person').value)body.person=$('#person').value;const data=await request('/api/search',body);if(requestId!==latestRequest)return;
    status.textContent=t(scope==='sources'?'sourceResults':'frameworkResults',{count:data.results.length});
    if(scope==='sources')renderSources(data);else{renderList(data.results,t('searchResults'));if(data.results.length)renderFramework(data.results[0]);else{activeId='';detail.replaceChildren(element('h2',t('tryAgain')),element('p',data.guidance));}}
  }catch(error){if(requestId===latestRequest)status.textContent=error.message;}
}
function wantedFramework(){try{return decodeURIComponent(location.hash.slice(1));}catch{return '';}}
function reset(){
  $('#query').value='';document.querySelector('input[value="frameworks"]').checked=true;$('#person-label').hidden=true;renderList(all,t('allFrameworks'));status.textContent=t('frameworkCount',{count:all.length});const wanted=wantedFramework();return selectFramework(all.some(f=>f.id===wanted)?wanted:'hormozi-offer');
}
$('#search-form').addEventListener('submit',event=>{event.preventDefault();search();});$('#reset').addEventListener('click',reset);
for(const radio of document.querySelectorAll('input[name="scope"]'))radio.addEventListener('change',()=>{$('#person-label').hidden=document.querySelector('input[name="scope"]:checked').value!=='sources';});
for(const button of document.querySelectorAll('[data-query]'))button.addEventListener('click',()=>{$('#query').value=t(button.dataset.query);search();});
window.addEventListener('hashchange',()=>{const id=wantedFramework();if(all.some(f=>f.id===id))selectFramework(id);});
async function load(){
  const requestId=++latestLoad;++latestRequest;
  try{
    const [data,profiles]=await Promise.all([request('/api/frameworks'),request('/api/people')]);if(requestId!==latestLoad)return;
    all=data.frameworks;const selected=$('#person').value,option=element('option',t('allPeople'));option.value='';$('#person').replaceChildren(option);
    for(const p of profiles.people){const option=element('option',p.name);option.value=p.id;$('#person').append(option);}$('#person').value=selected;
    if($('#query').value.trim())await search();else await reset();
  }catch(error){if(requestId!==latestLoad)return;status.textContent=error.message;detail.replaceChildren(element('p',t('loadError')));}
}
onLanguageChange(load);load();
