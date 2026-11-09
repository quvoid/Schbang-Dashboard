// South India Jewellery regional page. Playbook text: regional.js (window.REGIONAL).
// Raw data, one file per brand: regional-data/<slug>.json + cross.json (built by
// _shared/build_regional_full.py). Brand files load lazily when a tab opens.
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nf=n=>n==null||n===''?'–':(typeof n==='number'?n.toLocaleString('en-IN'):esc(n));
const short=n=>n==null?'–':n>=1e7?(n/1e7).toFixed(1)+' Cr':n>=1e5?(n/1e5).toFixed(1)+' L':n>=1e3?(n/1e3).toFixed(1)+'K':String(n);
const slug=b=>b.toLowerCase().replace(/[^a-z]+/g,'-').replace(/^-|-$/g,'');
const P=window.REGIONAL, CACHE={}, T={};
const st={tab:'Overview',view:'summary',lang:'All'};
try{const t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t;const b=JSON.parse(localStorage.getItem('regional-st')||'{}');Object.assign(st,b)}catch(e){}
const TABS=['Overview','Research','Cross-brand data',...P.brands.map(b=>b.name)];
if(!TABS.includes(st.tab))st.tab='Overview';
function save(){try{localStorage.setItem('regional-st',JSON.stringify({tab:st.tab,view:st.view}))}catch(e){}}
async function load(name){if(!CACHE[name])CACHE[name]=fetch(`regional-data/${name}.json`).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()});return CACHE[name]}

function bars(list){const t=Math.max(...list.map(x=>x.value),1);
  return list.length?`<div class="bars">${list.map(x=>`<div><em><span>${esc(x.name)}</span><span>${nf(x.value)}</span></em><s><u style="width:${Math.round(100*x.value/t)}%"></u></s></div>`).join('')}</div>`:'<p>No data.</p>'}
function vbars(pairs){const t=Math.max(...pairs.map(p=>p[1]),1);
  return `<div class="vbars">${pairs.map(([k,v])=>`<div title="${esc(k)}: ${nf(v)}" style="height:${Math.max(1,100*v/t)}%"></div>`).join('')}</div><div class="vlab">${pairs.map(([k],i)=>`<span>${i%3===0?esc(String(k).slice(2)):''}</span>`).join('')}</div>`}
function sec(h,sub,body){return `<section class="isec"><h2>${h}</h2>${sub?`<p class="sub">${sub}</p>`:''}${body}</section>`}
function go(t,view){st.tab=t;st.view=view||'summary';st.lang='All';save();render();window.scrollTo({top:0,behavior:'smooth'})}
function setView(v){st.view=v;save();render();const s=$('#subnav');if(s)s.scrollIntoView({behavior:'smooth',block:'start'})}
function tag(v){if(!v)return'–';const c=/likely/i.test(v)?'b':/possibly/i.test(v)?'p':/outperf/i.test(v)?'v':/organic/i.test(v)?'o':'';return `<span class="tag ${c}">${esc(v)}</span>`}

/* ---------- generic table: search + sort + paginate + expandable detail row ---------- */
// spec: {id, cols:[all col names], rows, show:[col names in table], num:[col names], clip:[col names], fmt:{col:fn}, filters:[col names], link:col}
function table(spec){const S=T[spec.id]||(T[spec.id]={q:'',sort:null,dir:-1,page:0,open:null,f:{}});
  const ix=c=>spec.cols.indexOf(c);let rows=spec.rows.map((r,i)=>({r,i}));
  const q=S.q.toLowerCase();if(q)rows=rows.filter(({r})=>r.some(v=>v!=null&&String(v).toLowerCase().includes(q)));
  for(const [c,v] of Object.entries(S.f))if(v)rows=rows.filter(({r})=>String(r[ix(c)]??'').split(/,\s*/).includes(v)||String(r[ix(c)]??'')===v);
  if(S.sort!=null){const k=ix(S.sort);rows.sort((a,b)=>{const x=a.r[k],y=b.r[k];if(x==null)return 1;if(y==null)return -1;return (typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y)))*S.dir})}
  const per=50,pages=Math.max(1,Math.ceil(rows.length/per));S.page=Math.min(S.page,pages-1);const view=rows.slice(S.page*per,S.page*per+per);
  const opts=c=>{const set={};spec.rows.forEach(r=>String(r[ix(c)]??'').split(/,\s*/).forEach(v=>{if(v)set[v]=(set[v]||0)+1}));return Object.entries(set).sort((a,b)=>b[1]-a[1]).slice(0,60)};
  const cell=(c,v,r)=>{const f=(spec.fmt||{})[c];if(f)return f(v,r);if(c===spec.link)return v?`<a href="${esc(v)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="color:var(--orange);font-weight:600;text-decoration:none">Open ↗</a>`:'–';return typeof v==='number'?nf(v):esc(v??'–')};
  return `<div class="tt"><input placeholder="Search ${spec.rows.length.toLocaleString('en-IN')} rows…" value="${esc(S.q)}" oninput="T['${spec.id}'].q=this.value;T['${spec.id}'].page=0;rerender('${spec.id}',this)">
    ${(spec.filters||[]).map(c=>`<select onchange="T['${spec.id}'].f['${esc(c)}']=this.value;T['${spec.id}'].page=0;rerender()"><option value="">${esc(c)}: all</option>${opts(c).map(([v,n])=>`<option value="${esc(v)}" ${S.f[c]===v?'selected':''}>${esc(v)} (${n})</option>`).join('')}</select>`).join('')}
    <span class="cnt">${rows.length.toLocaleString('en-IN')} shown · click a row for every field</span></div>
  <div class="scroll"><table class="tbl" style="min-width:${Math.max(700,spec.show.length*130)}px"><thead><tr>${spec.show.map(c=>`<th class="s" onclick="sortBy('${spec.id}','${esc(c)}')" style="${(spec.num||[]).includes(c)?'text-align:right':''}">${esc(c)}${S.sort===c?(S.dir>0?' ↑':' ↓'):''}</th>`).join('')}</tr></thead><tbody>
  ${view.map(({r,i})=>`<tr class="row" onclick="T['${spec.id}'].open=T['${spec.id}'].open===${i}?null:${i};rerender()">${spec.show.map(c=>`<td class="${(spec.num||[]).includes(c)?'n':(spec.clip||[]).includes(c)?'clip':''}">${(spec.clip||[]).includes(c)?`<div>${cell(c,r[ix(c)],r)}</div>`:cell(c,r[ix(c)],r)}</td>`).join('')}</tr>
    ${S.open===i?`<tr class="det"><td colspan="${spec.show.length}"><div class="kv">${spec.cols.map((c,k)=>r[k]==null?'':`<b>${esc(c)}</b><span>${/^https?:/.test(String(r[k]))?`<a href="${esc(r[k])}" target="_blank" rel="noopener" style="color:var(--orange)">${esc(r[k])}</a>`:typeof r[k]==='number'?nf(r[k]):esc(r[k])}</span>`).join('')}</div></td></tr>`:''}`).join('')||`<tr><td colspan="${spec.show.length}">No rows.</td></tr>`}
  </tbody></table></div>
  ${pages>1?`<div class="pager">Page ${S.page+1} of ${pages} <button class="pill" ${S.page?'':'disabled'} onclick="T['${spec.id}'].page--;rerender()">←</button><button class="pill" ${S.page<pages-1?'':'disabled'} onclick="T['${spec.id}'].page++;rerender()">→</button></div>`:''}`}
function sortBy(id,c){const S=T[id];if(S.sort===c)S.dir*=-1;else{S.sort=c;S.dir=-1}rerender()}
let rt;function rerender(id,inp){clearTimeout(rt);rt=setTimeout(()=>{const pos=inp?inp.selectionStart:null;render(true).then(()=>{if(id){const el=document.querySelector(`.tt input`);const all=[...document.querySelectorAll('.tt input')];const target=all.find(x=>x.value===T[id].q)||el;if(target){target.focus();if(pos!=null)target.setSelectionRange(pos,pos)}}})},inp?180:0)}

/* ---------- views ---------- */
function overview(){
  $('#title').textContent='Regional messaging · Tamil Nadu & AP/Telangana';
  $('#sub').textContent=`What ${P.brands.length} jewellers say in Tamil and Telugu across Meta ads, Google/YouTube ads and Instagram creator collabs. Snapshot ${P.generated}.`;
  return sec('Key insights','For the full write-up with numbers, open the Research tab.',`<div class="rg2">${P.insights.map(i=>`<div class="rc"><p class="ih">${esc(i.title)}</p><p>${esc(i.body)}</p></div>`).join('')}</div>`)+
  sec('Brand scorecard','Click a brand to open it, or click a number to go straight to that data.',`<div class="scroll"><table class="tbl"><thead><tr><th>Brand</th><th>Regional approach</th><th>Primary message</th><th>Hero offer</th><th style="text-align:right">Meta ads</th><th style="text-align:right">Meta Tamil/Telugu</th><th style="text-align:right">Google (live)</th><th style="text-align:right">YouTube Tamil / Telugu</th><th style="text-align:right">IG creators</th></tr></thead><tbody>${P.brands.map(b=>{const s=b.stats,n=esc(b.name);return `<tr class="go" onclick="go('${n}')"><td><b>${n}</b></td><td>${esc(b.approach)}</td><td>${esc(b.message)}</td><td>${esc(b.hero)}</td><td class="n"><a onclick="event.stopPropagation();go('${n}','meta')" style="color:var(--orange);cursor:pointer">${nf(s.meta)}</a></td><td class="n">${nf(s.meta_tt)}</td><td class="n"><a onclick="event.stopPropagation();go('${n}','google')" style="color:var(--orange);cursor:pointer">${nf(s.google)}</a> (${nf(s.google_live)})</td><td class="n">${s.yt_tamil} / ${s.yt_telugu}</td><td class="n"><a onclick="event.stopPropagation();go('${n}','creators')" style="color:var(--orange);cursor:pointer">${s.ig_creators}</a></td></tr>`}).join('')}</tbody></table></div>`)+
  sec('Sources & caveats','',`<div class="rc"><dl class="notes" style="margin:0">${P.notes.map(n=>`<dt>${esc(n.source)}</dt><dd>${esc(n.detail)}</dd>`).join('')}</dl></div>`)}

async function research(){const C=await load('cross');
  $('#title').textContent='Research: how South India jewellers advertise';
  $('#sub').textContent='A full analysis across 2,623 Meta ads, 22,135 Google ads, 2,829 YouTube videos, 298 creator collabs and 950 boosted-YouTube candidates.';
  return C.research.map(r=>sec(esc(r.h),'',`<div class="rc res"><ul>${r.p.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`)).join('')}

function heat(m,title,sub,limit=20){const rows=m.rows.slice(0,limit),mx=Math.max(1,...rows.flatMap(r=>r.slice(1)));
  return sec(title,sub,`<div class="scroll"><table class="tbl heat"><thead><tr><th></th>${m.cols.map(c=>`<th style="text-align:right">${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><td><b>${esc(r[0])}</b></td>${r.slice(1).map(v=>`<td class="h" style="background:rgba(242,85,44,${(v/mx*0.55).toFixed(2)})">${v?nf(v):'·'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`)}
function plain(t,title,sub){return sec(title,sub,`<div class="scroll"><table class="tbl"><thead><tr>${t.cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r=>`<tr>${r.map(v=>`<td class="${typeof v==='number'?'n':''}">${typeof v==='number'?nf(v):esc(v??'–')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`)}
async function crossView(){const C=await load('cross'),M=C.meta_matrix;
  $('#title').textContent='Cross-brand data';$('#sub').textContent='Every brand side by side. Counts are numbers of ads; colour intensity shows share within the table.';
  return plain(C['Meta summary'],'Meta Ad Library summary','')+
   heat(M['Themes'],'Meta: message themes by brand','One ad can carry several themes.')+
   heat(M['Festival'],'Meta: festival hooks by brand','')+
   heat(M['CTA Button'],'Meta: CTA buttons by brand','')+
   heat(M['Landing Page Type'],'Meta: where ads send people','')+
   heat(M['Format'],'Meta: ad formats','')+
   heat(M['Caption Language'],'Meta: caption language','')+
   heat(M['Spoken Language (video)'],'Meta: spoken language in transcribed videos','Covers the regional-messaging set only.')+
   heat({cols:C.meta_month.cols,rows:C.meta_month.rows.slice().reverse()},'Meta: ads started per month (still in library)','Newest first.',30)+
   plain(C['Brand overview'],'Google Ads Transparency: brand overview','')+
   plain(C['Ad type mix'],'Google: ad type mix (all ads)','')+plain(C['Ad type mix (live)'],'Google: ad type mix (live ≤7 days)','')+
   plain(C['Themes % (all ads)'],'Google: themes, % of ads','')+plain(C['Themes % (live ads)'],'Google: themes, % of live ads','')+
   plain(C['Video languages'],'Google: YouTube ad spoken languages','')+plain(C['New ads by month'],'Google: new ads by month','')+
   plain(C['Agencies'],'Google: who pays for the ads (agencies)','')+plain(C['IG overview'],'Instagram creator collabs: overview','')+
   plain(C['YouTube benchmarks'],'YouTube boosted-campaign benchmarks','Third-party audit; "boosted" is inferred from views versus the channel median.')+plain(C['QC'],'Google data quality checks','')}

const _V=0;const VIEWS=[['summary','Summary'],['meta','Meta ads'],['creators','Creators'],['google','Google & YouTube'],['boosted','Boosted YouTube']];
function subnav(b,D){const cnt={meta:D?.meta.rows.length,creators:D?.creators.length,google:D?D.yt.rows.length+D.search.rows.length+D.display.rows.length+D.maps.rows.length:null,boosted:D?.ya.rows.length};
  return `<div class="sub">${VIEWS.map(([k,l])=>`<button class="${st.view===k?'on':''}" onclick="setView('${k}')">${l}${cnt[k]!=null?`<em>${nf(cnt[k])}</em>`:''}</button>`).join('')}</div>`}

const PB=[['positioning','Positioning'],['language','Regional-language approach'],['messaging','Core messaging'],['offers','Hero offers'],['festivals','Festival calendar'],['cta','CTA & conversion path'],['creators','Creators & celebrities']];
function summary(b,D){const s=b.stats,F=b.fields,ex=b.examples.filter(e=>st.lang==='All'||e.language===st.lang);
  return `<section class="rg4" style="margin:18px 0 28px">
    <div class="rc rk click" onclick="setView('meta')"><b>${nf(s.meta)}</b><span>Meta ads · ${nf(s.meta_tt)} in Tamil/Telugu</span><span class="go">See all Meta ads →</span></div>
    <div class="rc rk click" onclick="setView('google')"><b>${nf(s.google)}</b><span>Google &amp; YouTube ads · ${nf(s.google_live)} live</span><span class="go">See Google &amp; YouTube →</span></div>
    <div class="rc rk click" onclick="setView('google');T['yt-${slug(b.name)}']={q:'',sort:'Views',dir:-1,page:0,open:null,f:{}}"><b>${s.yt_tamil} / ${s.yt_telugu}</b><span>YouTube ads spoken in Tamil / Telugu</span><span class="go">See videos →</span></div>
    <div class="rc rk click" onclick="setView('creators')"><b>${nf(D.creators.length)}</b><span>Instagram creators · ${nf(s.ig_posts)} collab posts · ${s.ig_boosted} likely boosted</span><span class="go">See creators &amp; metrics →</span></div></section>`+
  sec('The takeaway','',`<div class="rc accent"><h3>Signature line</h3><p class="ih">${esc(F.signature)}</p><h3 style="margin-top:14px">So what for us</h3><p>${esc(F.sowhat)}</p></div>`)+
  sec('Research notes','Taken from the raw data for this brand.',`<div class="rc res"><ul>${D.notes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`)+
  sec('Playbook','How the brand speaks, what it offers and how it converts.',`<div class="rg2">${PB.map(([k,h])=>`<div class="rc"><h3>${h}</h3><p>${esc(F[k])}</p></div>`).join('')}</div>`)+
  sec('In numbers','Counts of Meta ads. Neither platform publishes spend or reach for Indian commercial ads.',`<div class="rg2">
    <div class="rc"><h3>Meta ad themes</h3>${bars(b.themes)}</div><div class="rc"><h3>Meta CTA buttons</h3>${bars(b.ctas)}</div>
    <div class="rc"><h3>Where Meta ads send people</h3>${bars(b.landing)}</div><div class="rc"><h3>YouTube ads by spoken language</h3>${bars(b.yt_languages)}</div></div>`)+
  sec('Best regional examples','The highest-reach Tamil and Telugu ads. Every ad is listed in the other views.',
   `<div class="seg" style="margin-bottom:12px">${['All','Tamil','Telugu'].map(l=>`<button class="${st.lang===l?'on':''}" onclick="st.lang='${l}';render()">${l}</button>`).join('')}</div>
    <div class="rc" style="background:var(--panel);border:1px solid var(--line)">${ex.length?ex.map(e=>`<div class="ex"><div class="meta"><span class="chip l">${esc(e.language)}</span><span class="chip">${esc(e.channel)}</span>${e.title?`<span>${esc(e.title)}</span>`:''}${e.views!=null?`<span>${nf(e.views)} views</span>`:''}${e.url?`<a href="${esc(e.url)}" target="_blank" rel="noopener">Open ↗</a>`:''}</div><p>${esc(e.english)}</p>${e.original?`<p class="o">${esc(e.original)}</p>`:''}</div>`).join(''):`<p>No transcribed ${st.lang==='All'?'':st.lang+' '}ads for this brand.</p>`}</div>`)}

function metaView(b,D){const m=D.meta,ix=c=>m.cols.indexOf(c),R=m.rows;
  const act=R.filter(r=>r[ix('Status')]==='Active').length,cp=R.filter(r=>r[ix('Creator Partnership')]==='Yes').length,reg=R.filter(r=>/Tamil|Telugu/.test((r[ix('Caption Language')]||'')+(r[ix('Spoken Language (video)')]||''))).length;
  const days=R.map(r=>r[ix('Days Running')]).filter(x=>x!=null).sort((a,b)=>a-b);
  return `<section class="rg4" style="margin:18px 0 22px"><div class="rc rk"><b>${nf(R.length)}</b><span>Meta ads · ${nf(act)} active</span></div><div class="rc rk"><b>${nf(reg)}</b><span>in Tamil / Telugu (caption or speech)</span></div><div class="rc rk"><b>${nf(cp)}</b><span>creator-partnership ads</span></div><div class="rc rk"><b>${days.length?days[days.length>>1]:'–'} d</b><span>median days running · max ${days.length?days[days.length-1]:'–'}</span></div></section>`+
  (D.meta_creators.length?sec('Creators in Meta partnership ads','"<Creator> with <Brand>" ads in the Meta Ad Library.',`<div class="scroll"><table class="tbl"><thead><tr><th>Creator page</th><th style="text-align:right">Ads</th><th style="text-align:right">Active</th><th>First started</th><th style="text-align:right">Longest run (days)</th></tr></thead><tbody>${D.meta_creators.sort((a,b)=>b.ads-a.ads).map(x=>`<tr><td><b>${esc(x.page)}</b></td><td class="n">${x.ads}</td><td class="n">${x.active}</td><td>${esc(x.first)}</td><td class="n">${x.longest}</td></tr>`).join('')}</tbody></table></div>`):'')+
  sec('Every Meta ad','Sorted by days running (longest-lived first). Click a row for the full caption, transcript, UTM and landing URL.',table({id:'meta-'+slug(b.name),cols:m.cols,rows:R,
   show:['Status','Started','Days Running','Format','Caption Language','Spoken Language (video)','Hook (first line)','CTA Button','Landing Page Type','Offer %','Festival','Themes','Ad Library Link'],
   num:['Days Running','Offer %'],clip:['Hook (first line)','Themes'],link:'Ad Library Link',filters:['Status','Format','Caption Language','Spoken Language (video)','CTA Button','Landing Page Type','Festival','Themes','Creator Partnership']}))}

function creatorsView(b,D){const C=D.creators,P_=D.posts,tot=k=>C.reduce((s,x)=>s+(x[k]||0),0),vc={};P_.rows.forEach(r=>{const v=r[P_.cols.indexOf('Boost Verdict')];vc[v]=(vc[v]||0)+1});
  const cols=['Creator','Tier','Followers','Collab posts','Total views','Top post views','Avg ER %','Avg like/view %','Usual views (baseline)','Best lift vs usual (x)','Usual ER %','Hit rate %','Verdicts','Languages','First collab','Last collab','Brand handle(s)'];
  const rows=C.map(x=>[x.creator,x.tier,x.followers,x.posts,x.views,x.top_views,x.er,x.ltv,x.normal_views,x.lift,x.normal_er,x.hit,Object.entries(x.verdicts).map(([k,v])=>`${k}${v>1?' ×'+v:''}`).join(', '),x.langs.filter(l=>l!=='-').join(', '),x.first,x.last,x.handles.join(', ')]);
  return `<section class="rg4" style="margin:18px 0 22px"><div class="rc rk"><b>${nf(C.length)}</b><span>unique creators · ${nf(P_.rows.length)} collab posts</span></div><div class="rc rk"><b>${short(tot('views'))}</b><span>total views on collab posts</span></div><div class="rc rk"><b>${nf(vc['Likely boosted']||0)}</b><span>likely boosted · ${nf(vc['Possibly boosted']||0)} possibly</span></div><div class="rc rk"><b>${nf((vc['Organic']||0)+(vc['Organic outperformance']||0))}</b><span>organic · ${nf(vc['Organic outperformance']||0)} outperformed their usual</span></div></section>`+
  sec('Creators','One row per creator. Click a creator to see every metric, then see their posts below. Boost verdict = the post\'s views and like rate compared with that creator\'s own last 10 reels.',table({id:'cr-'+slug(b.name),cols,rows,
    show:['Creator','Tier','Followers','Collab posts','Total views','Avg ER %','Avg like/view %','Usual views (baseline)','Best lift vs usual (x)','Verdicts','Languages'],num:['Followers','Collab posts','Total views','Avg ER %','Avg like/view %','Usual views (baseline)','Best lift vs usual (x)'],
    fmt:{Creator:v=>`<b>${esc(v)}</b> <a href="https://www.instagram.com/${esc(String(v).replace('@',''))}/" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="color:var(--orange);text-decoration:none">↗</a>`,Verdicts:v=>String(v||'').split(', ').map(tag).join(' ')},filters:['Tier','Languages']}))+
  sec('Every collab post','All Instagram posts this brand co-authored with a creator, with the boost reasoning and transcript.',table({id:'po-'+slug(b.name),cols:P_.cols,rows:P_.rows,
    show:['Post Date','Creator','Followers','Boost Verdict','Views','Likes','Comments','Like-to-View %','ER %','Creator Normal Views','Views vs Normal (x)','Lang','Post Link'],num:['Followers','Views','Likes','Comments','Like-to-View %','ER %','Creator Normal Views','Views vs Normal (x)'],
    fmt:{'Boost Verdict':tag},link:'Post Link',filters:['Boost Verdict','Lang','Creator']}))+
  (D.creator_ads&&D.creator_ads.rows.length?sec('Paid creator-partnership ads: transcripts','Every "<Creator> with <Brand>" ad in the Meta Ad Library, with what the creator says in the original language and in English. Open a row for the full transcript, caption and on-image text.',table({id:'ca-'+slug(b.name),cols:D.creator_ads.cols,rows:D.creator_ads.rows,
    show:['Creator Page','Status','Started','Days Running','Spoken Language','Video Transcript (English)','CTA','Ad Library Link'],num:['Days Running'],clip:['Video Transcript (English)'],link:'Ad Library Link',filters:['Creator Page','Spoken Language','Status']})):'')+
  (D.th_er?sec('Thangamayil regional reels vs each creator\'s usual','Engagement benchmark against each creator\'s last 10 reels.',table({id:'th',cols:D.th_er.cols,rows:D.th_er.rows,show:['Post Date','Creator(s)','Language','Views','Likes','Comments','Shares','ER %','Creator Avg ER % (last 10 reels)',"Creator's Usual Views (median of last 10 reels)","This Post vs Creator's Usual (x)",'In Simple Words','Post Link'],num:['Views','Likes','Comments','Shares','ER %'],link:'Post Link'})):'')}

function gTable(t){return t&&t.rows.length?`<div class="scroll"><table class="tbl"><thead><tr>${t.cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r=>`<tr>${r.map(v=>`<td class="${typeof v==='number'?'n':''}">${typeof v==='number'?nf(v):esc(v??'–')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'<p class="sub">No data.</p>'}
function googleView(b,D){const O=D.g_overview,s=slug(b.name);
  const mo=D.g_month.rows.length?D.g_month.cols.slice(1).map((c,i)=>[c,D.g_month.rows.reduce((t,r)=>t+(r[i+1]||0),0)]):[];
  const lang=D.g_lang.rows.length?D.g_lang.cols.slice(1).map((c,i)=>({name:c,value:D.g_lang.rows.reduce((t,r)=>t+(r[i+1]||0),0)})).filter(x=>x.value).sort((a,b)=>b.value-a.value):[];
  const mix=D.g_mix.rows.length?D.g_mix.cols.slice(1,-1).map((c,i)=>({name:c,value:D.g_mix.rows.reduce((t,r)=>t+(r[i+1]||0),0)})).filter(x=>x.value).sort((a,b)=>b.value-a.value):[];
  return sec('Google Ads Transparency overview','Searched by the brand\'s website, so agency-run ads are included.',gTable(O))+
   `<div class="rg2" style="margin-bottom:28px"><div class="rc"><h3>Ad type mix (all ads)</h3>${bars(mix)}</div><div class="rc"><h3>YouTube ads by spoken language</h3>${bars(lang)}</div>
    <div class="rc" style="grid-column:1/-1"><h3>New Google ads per month</h3>${mo.length?vbars(mo):'<p>No data.</p>'}</div></div>`+
   sec('Themes, % of ads','',gTable(D.g_themes))+sec('Themes, % of live ads','',gTable(D.g_themes_live))+sec('Who pays (agencies)','',gTable(D.g_agencies))+
   sec('Every YouTube video ad','Unique videos used in Google ads, with spoken language, views and the transcript (open a row).',table({id:'yt-'+s,cols:D.yt.cols,rows:D.yt.rows,
     show:['YouTube title','Spoken language','Views','Length (sec)','Ad creatives using it','First shown','Last shown','Live (≤7 days)','Themes','YouTube URL'],num:['Views','Length (sec)','Ad creatives using it'],clip:['YouTube title','Themes'],link:'YouTube URL',filters:['Spoken language','Live (≤7 days)','Themes']}))+
   sec('Every search & shopping ad','Deduplicated by ad text. "Creatives" counts how many Google creatives use that exact text.',table({id:'se-'+s,cols:D.search.cols,rows:D.search.rows,
     show:['Ad text','Creatives','Type','Themes','First shown','Last shown','Live creatives','Paid by'],num:['Creatives','Live creatives'],clip:['Ad text','Themes'],filters:['Type','Themes','Paid by']}))+
   sec('Every display ad','Text read from the banner (OCR), deduplicated.',table({id:'di-'+s,cols:D.display.cols,rows:D.display.rows,
     show:['Ad text','Creatives','Themes','First shown','Last shown','Text quality','Transparency link'],num:['Creatives'],clip:['Ad text','Themes'],link:'Transparency link',filters:['Themes','Text quality']}))+
   sec('Google Maps / local store ads','Which showrooms are promoted on Maps.',table({id:'mp-'+s,cols:D.maps.cols,rows:D.maps.rows,show:['Store / location','Ads','First shown','Last shown','Ad text'],num:['Ads'],clip:['Ad text']}))}

function boostedView(b,D){const s=slug(b.name);
  return sec('YouTube benchmark','From the third-party YouTube audit: channel mean vs median views. "Boosted" is inferred from views far above the channel median, not confirmed paid media.',
    `<div class="scroll"><table class="tbl"><thead><tr>${D.ya_bench_cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${D.ya_bench.map(r=>`<tr>${r.map(v=>`<td class="${typeof v==='number'?'n':''}">${typeof v==='number'?nf(v):esc(v??'–')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`)+
  sec('Every boosted Tamil / Telugu campaign','Sorted by rank (views). Open a row for the transcript and translation.',table({id:'ya-'+s,cols:D.ya.cols,rows:D.ya.rows,
    show:['Rank','Language','Campaign Title','Format','View Count','Multiplier (vs Median)','Campaign Focus','YouTube URL'],num:['Rank','View Count'],clip:['Campaign Title','Campaign Focus'],link:'YouTube URL',filters:['Language','Format','Campaign Focus']}))}

async function brandView(b,tok){const D=await load(slug(b.name));if(tok!==RTOK)return null;
  $('#title').textContent=b.name;$('#sub').textContent=b.approach+' · '+b.message;
  $('#subnav').innerHTML=subnav(b,D);
  return ({summary,meta:metaView,creators:creatorsView,google:googleView,boosted:boostedView}[st.view]||summary)(b,D)}

let RTOK=0;
async function render(keep){const tok=++RTOK;
  $('#btabs').innerHTML=TABS.map(t=>`<button class="${st.tab===t?'on':''}" onclick="go('${esc(t)}')">${esc(t)}</button>`).join('');
  $('#subnav').innerHTML='';
  if(!keep)$('#body').innerHTML='<div class="loading">Loading…</div>';
  try{
    const html=st.tab==='Overview'?overview():st.tab==='Research'?await research():st.tab==='Cross-brand data'?await crossView():await brandView(P.brands.find(b=>b.name===st.tab),tok);
    if(tok!==RTOK||html==null)return;
    $('#body').innerHTML=html;
  }catch(e){$('#body').innerHTML=`<div class="loading">Could not load data (${esc(e.message)}).</div>`}}
$('#theme').onclick=()=>{const r=document.documentElement,dark=r.dataset.theme==='dark';r.dataset.theme=dark?'light':'dark';try{localStorage.setItem('theme',r.dataset.theme)}catch(_){}};
render();
