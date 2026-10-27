const $=id=>document.getElementById(id);
const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
let people=[],current=null;
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function render(){
  const words=normalize($('people-search').value).trim().split(/\s+/).filter(Boolean),category=$('people-category').value;
  const filtered=people.filter(p=>(!category||p.category===category)&&words.every(w=>normalize([p.name,p.summary,p.category,...p.topics,...p.principles].join(' ')).includes(w)));
  $('people-list').replaceChildren();$('people-count').textContent=`${filtered.length} av ${people.length} personer`;$('people-empty').hidden=Boolean(filtered.length);
  for(const person of filtered){const button=el('button');button.type='button';button.className='person-card';button.append(el('span',person.category));const title=el('h2',person.name);const arrow=el('span','↗');arrow.setAttribute('aria-hidden','true');title.append(arrow);button.append(title,el('p',person.summary));button.addEventListener('click',()=>openPerson(person.id));$('people-list').append(button);}
}
function section(title,items){const box=el('section');box.className='person-section';box.append(el('h3',title));const ul=el('ul');items.forEach(text=>ul.append(el('li',text)));box.append(ul);$('person-detail').append(box);return box;}
function openPerson(id){
  const p=people.find(p=>p.id===id);if(!p)return;current=p;
  $('person-name').textContent=p.name;$('person-category').textContent=p.category;$('person-summary').textContent=p.summary;$('person-detail').replaceChildren();
  section('Egna svenska tillämpningar',p.principles);section('Frågor att arbeta med',p.questions);
  const box=section('Källor från originalprojektet',[]);box.querySelector('ul').remove();const note=el('p','Ärvda källhänvisningar. Läs originalet innan du tillskriver personen ett råd. Dessa svenska tillämpningar är inte citat eller ett officiellt samarbete.');note.className='source-note';box.append(note);
  const ul=el('ul');for(const source of p.sources){const li=el('li'),a=el('a',source.title+' ↗');a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';li.append(a);ul.append(li);}box.append(ul);
  $('use-person').href='/?perspective='+encodeURIComponent(p.id);$('copy-status').textContent='';history.replaceState(null,'','#'+p.id);if(!$('person-dialog').open)$('person-dialog').showModal();
}
$('people-search').addEventListener('input',render);$('people-category').addEventListener('change',render);
$('close-person').addEventListener('click',()=>$('person-dialog').close());
$('person-dialog').addEventListener('close',()=>history.replaceState(null,'',location.pathname+location.search));
$('copy-person').addEventListener('click',async()=>{if(!current)return;const p=current;const text=[p.name+' — '+p.summary,'Egna svenska tillämpningar, inte citat. Källhänvisningarna är ärvda och inte självständigt verifierade.',...p.principles,'Frågor:',...p.questions,'Källor:',...p.sources.map(s=>s.title+'\n'+s.url),'Använd perspektivet för att pröva briefen. Skriv direkt på svenska med avsändarens röst. Bevara fakta och villkor; använd inte personens namn som produktbevis.'].join('\n\n');try{await navigator.clipboard.writeText(text);$('copy-status').textContent='Perspektivet är kopierat.';}catch{$('copy-status').textContent='Kopieringen blockerades. Markera innehållet och kopiera manuellt.';}});
window.addEventListener('hashchange',()=>{if(location.hash)openPerson(decodeURIComponent(location.hash.slice(1)));});
fetch('/api/people').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{people=data.people.sort((a,b)=>a.name.localeCompare(b.name,'sv'));for(const category of [...new Set(people.map(p=>p.category))].sort()){const option=el('option',category);option.value=category;$('people-category').append(option);}render();if(location.hash)openPerson(decodeURIComponent(location.hash.slice(1)));}).catch(()=>{$('people-count').textContent='Profilerna kunde inte läsas. Ladda om sidan och försök igen.';});
