// Visual layer for regional.html. Loaded after regional-app.js and replaces its views
// with chart-first versions. Every raw table stays reachable behind a "Show all rows" toggle.
// Charts are plain inline SVG/CSS in the Schbang palette (no libraries), theme-aware via CSS vars.

const PAL=['#f2552c','#45c4dc','#f0a6d8','#f3e33a','#8b7cf6','#1f9d55','#a7a39d','#ff9f68','#2f6fde','#d64f8a','#6bd3a0','#c9a227'];
const BRAND_C={};window.REGIONAL.brands.forEach((b,i)=>BRAND_C[b.name]=PAL[i%PAL.length]);
const VERD_C={'Likely boosted':'#f2552c','Possibly boosted':'#f3e33a','Organic outperformance':'#45c4dc','Organic':'#1f9d55','Not enough data':'#a7a39d'};
const pct=(v,t)=>t?Math.round(100*v/t):0;
const countBy=(rows,i,split)=>{const m={};rows.forEach(r=>{const v=r[i];if(v==null)return;(split?String(v).split(/,\s*/):[String(v)]).forEach(k=>{if(k&&k!=='-')m[k]=(m[k]||0)+1})});return Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([name,value])=>({name,value}))};
const topN=(l,n=6)=>{if(l.length<=n)return l;const h=l.slice(0,n-1),r=l.slice(n-1).reduce((s,x)=>s+x.value,0);return [...h,{name:'Other',value:r}]};

/* ---------- chart primitives ---------- */
function card(title,body,sub,cls=''){return `<div class="vc ${cls}">${title?`<h3>${title}</h3>`:''}${sub?`<p class="vs">${sub}</p>`:''}${body}</div>`}
function donut(list,{center,fmt=nf,size=150}={}){list=topN(list.filter(x=>x.value>0));const t=list.reduce((s,x)=>s+x.value,0);if(!t)return '<p class="vs">No data.</p>';
  const R=60,C=2*Math.PI*R;let off=0;
  const arcs=list.map((x,i)=>{const len=C*x.value/t,a=`<circle r="${R}" cx="75" cy="75" fill="none" stroke="${x.color||PAL[i%PAL.length]}" stroke-width="22" stroke-dasharray="${len} ${C-len}" stroke-dashoffset="${-off}" transform="rotate(-90 75 75)"><title>${esc(x.name)}: ${fmt(x.value)} (${pct(x.value,t)}%)</title></circle>`;off+=len;return a}).join('');
  return `<div class="donut"><svg viewBox="0 0 150 150" width="${size}" height="${size}">${arcs}<text x="75" y="72" text-anchor="middle" class="dc1">${center??fmt(t)}</text><text x="75" y="92" text-anchor="middle" class="dc2">${center?'':'total'}</text></svg>
    <ul class="lg">${list.map((x,i)=>`<li><i style="background:${x.color||PAL[i%PAL.length]}"></i><span>${esc(x.name)}</span><b>${pct(x.value,t)}%</b></li>`).join('')}</ul></div>`}
function hbars(list,{fmt=nf,color,max,colors}={}){if(!list.length)return '<p class="vs">No data.</p>';const m=max||Math.max(...list.map(x=>x.value),1);
  return `<div class="hb">${list.map((x,i)=>`<div class="hbr" title="${esc(x.name)}: ${fmt(x.value)}"><span class="hbl">${esc(x.name)}</span><span class="hbt"><u style="width:${Math.max(1.5,100*x.value/m)}%;background:${x.color||(colors?colors[i%colors.length]:color||'var(--ink)')}"></u></span><b>${fmt(x.value)}</b></div>`).join('')}</div>`}
// grouped: rows [{name, values:[..]}], series names + colours
function grouped(rows,series,cols,{fmt=nf}={}){const m=Math.max(1,...rows.flatMap(r=>r.values));
  return `<div class="lgh">${series.map((s,i)=>`<span><i style="background:${cols[i]}"></i>${esc(s)}</span>`).join('')}</div><div class="hb">${rows.map(r=>`<div class="hbr g"><span class="hbl">${esc(r.name)}</span><span class="hbt">${r.values.map((v,i)=>`<u title="${esc(series[i])}: ${fmt(v)}" style="width:${Math.max(.8,100*v/m)}%;background:${cols[i]}"></u>`).join('')}</span><b>${r.values.map(fmt).join(' · ')}</b></div>`).join('')}</div>`}
// stacked 100%: per row segments [{name,value}]
function stack100(rows,{n=6}={}){const tot={};rows.forEach(r=>r.segs.forEach(s=>tot[s.name]=(tot[s.name]||0)+s.value));
  const keys=Object.entries(tot).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);const keep=keys.slice(0,n),col=k=>k==='Other'?'var(--line)':PAL[keep.indexOf(k)%PAL.length];
  const norm=r=>{const m={};r.segs.forEach(s=>{const k=keep.includes(s.name)?s.name:'Other';m[k]=(m[k]||0)+s.value});return [...keep,'Other'].filter(k=>m[k]).map(k=>({name:k,value:m[k]}))};
  return `<div class="lgh">${[...keep,...(keys.length>n?['Other']:[])].map(k=>`<span><i style="background:${col(k)}"></i>${esc(k)}</span>`).join('')}</div>
  <div class="st">${rows.map(r=>{const s=norm(r),t=s.reduce((a,x)=>a+x.value,0);return `<div class="str"><span class="hbl">${esc(r.name)}</span><span class="stb">${s.map(x=>`<u title="${esc(x.name)}: ${nf(x.value)} (${pct(x.value,t)}%)" style="width:${100*x.value/t}%;background:${col(x.name)}">${pct(x.value,t)>=9?pct(x.value,t)+'%':''}</u>`).join('')}</span><b>${nf(t)}</b></div>`}).join('')}</div>`}
function columns(pairs,{color='var(--ink)',fmt=nf,h=150,every}={}){if(!pairs.length)return '<p class="vs">No data.</p>';const m=Math.max(1,...pairs.map(p=>p[1]));every=every||Math.ceil(pairs.length/12);
  return `<div class="cols" style="height:${h}px">${pairs.map(([k,v])=>`<div title="${esc(k)}: ${fmt(v)}"><u style="height:${Math.max(1,100*v/m)}%;background:${color}"></u></div>`).join('')}</div><div class="colx">${pairs.map(([k],i)=>`<span>${i%every===0?esc(k):''}</span>`).join('')}</div>`}
// multi-series line chart: series [{name,color,values:[...]}], labels [...]
function lines(labels,series,{h=200}={}){const W=720,H=h,P={l:44,r:12,t:12,b:26};const m=Math.max(1,...series.flatMap(s=>s.values));
  const x=i=>P.l+(W-P.l-P.r)*i/Math.max(1,labels.length-1),y=v=>H-P.b-(H-P.t-P.b)*v/m;
  const ticks=[0,.25,.5,.75,1].map(f=>Math.round(m*f));const every=Math.ceil(labels.length/10);
  return `<div class="lgh">${series.map(s=>`<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div><svg viewBox="0 0 ${W} ${H}" class="ln" preserveAspectRatio="none">
   ${ticks.map(t=>`<line x1="${P.l}" x2="${W-P.r}" y1="${y(t)}" y2="${y(t)}" class="gl"/><text x="${P.l-6}" y="${y(t)+4}" text-anchor="end" class="ax">${short(t)}</text>`).join('')}
   ${labels.map((l,i)=>i%every===0?`<text x="${x(i)}" y="${H-6}" text-anchor="middle" class="ax">${esc(l)}</text>`:'').join('')}
   ${series.map(s=>`<polyline fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round" points="${s.values.map((v,i)=>`${x(i)},${y(v)}`).join(' ')}"><title>${esc(s.name)}</title></polyline>${s.values.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="${s.color}"><title>${esc(s.name)} ${esc(labels[i])}: ${nf(v)}</title></circle>`).join('')}`).join('')}</svg>`}
// scatter on log axes: pts [{x,y,r,color,label}]
function scatter(pts,{xl,yl}={}){pts=pts.filter(p=>p.x>0&&p.y>0);if(!pts.length)return '<p class="vs">No data.</p>';
  const W=720,H=320,P={l:54,r:16,t:14,b:36},lx=Math.log10,xs=pts.map(p=>lx(p.x)),ys=pts.map(p=>lx(p.y));
  const x0=Math.floor(Math.min(...xs)),x1=Math.ceil(Math.max(...xs)),y0=Math.floor(Math.min(...ys)),y1=Math.ceil(Math.max(...ys));
  const X=v=>P.l+(W-P.l-P.r)*(lx(v)-x0)/Math.max(1,x1-x0),Y=v=>H-P.b-(H-P.t-P.b)*(lx(v)-y0)/Math.max(1,y1-y0);
  const gx=[],gy=[];for(let e=x0;e<=x1;e++)gx.push(10**e);for(let e=y0;e<=y1;e++)gy.push(10**e);
  return `<svg viewBox="0 0 ${W} ${H}" class="ln">${gx.map(v=>`<line x1="${X(v)}" x2="${X(v)}" y1="${P.t}" y2="${H-P.b}" class="gl"/><text x="${X(v)}" y="${H-P.b+16}" text-anchor="middle" class="ax">${short(v)}</text>`).join('')}
   ${gy.map(v=>`<line x1="${P.l}" x2="${W-P.r}" y1="${Y(v)}" y2="${Y(v)}" class="gl"/><text x="${P.l-6}" y="${Y(v)+4}" text-anchor="end" class="ax">${short(v)}</text>`).join('')}
   <text x="${W/2}" y="${H-2}" text-anchor="middle" class="ax">${esc(xl||'')} →</text><text x="12" y="${H/2}" transform="rotate(-90 12 ${H/2})" text-anchor="middle" class="ax">${esc(yl||'')} →</text>
   ${pts.sort((a,b)=>b.r-a.r).map(p=>`<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${p.r}" fill="${p.color}" fill-opacity=".72" stroke="var(--panel)" stroke-width="1.2"><title>${esc(p.label)}</title></circle>`).join('')}</svg>`}
function big(n,label,{go:g,sub}={}){return `<div class="kc ${g?'click':''}" ${g?`onclick="${g}"`:''}><b>${n}</b><span>${label}</span>${sub?`<em>${sub}</em>`:''}${g?'<i>→</i>':''}</div>`}
function grid(n,...cards){return `<div class="vg vg${n}">${cards.join('')}</div>`}

/* ---------- table behind a toggle ---------- */
const _tbl=window.table;
window.table=function(spec){const S=T[spec.id]||(T[spec.id]={q:'',sort:null,dir:-1,page:0,open:null,f:{},show:false});
  return `<button class="pill tgl" onclick="T['${spec.id}'].show=!T['${spec.id}'].show;rerender()">${S.show?'Hide rows ▲':`Show all ${spec.rows.length.toLocaleString('en-IN')} rows ▼`}</button>${S.show?`<div style="margin-top:12px">${_tbl(spec)}</div>`:''}`};
function fold(label,html){const id='f-'+label.replace(/\W+/g,'');const S=T[id]||(T[id]={show:false});
  return `<button class="pill tgl" onclick="T['${id}'].show=!T['${id}'].show;rerender()">${S.show?'Hide '+label+' ▲':'Show '+label+' ▼'}</button>${S.show?`<div style="margin-top:12px">${html}</div>`:''}`}

/* ---------- overview ---------- */
overview=async function(){const C=await load('cross'),B=P.brands;
  $('#title').textContent='Regional messaging · Tamil Nadu & AP/Telangana';
  $('#sub').textContent=`How ${B.length} jewellers advertise in Tamil and Telugu across Meta, Google/YouTube and Instagram creators. Snapshot ${P.generated}.`;
  const sum=k=>B.reduce((s,b)=>s+(b.stats[k]||0),0);
  const ig=C['IG overview'],igi=c=>ig.cols.indexOf(c);
  const verdRows=ig.rows.map(r=>({name:r[0],segs:['Likely Boosted','Possibly Boosted','Organic Outperformance','Organic'].map(k=>({name:k,value:r[igi(k)]||0}))}));
  const od=C.offer_depth,odl=B.map(b=>{const k=Object.keys(od).find(x=>x===b.name);return {name:b.name,value:k?od[k].median||0:0,color:BRAND_C[b.name]}}).filter(x=>x.value).sort((a,b)=>b.value-a.value);
  const sov=B.map(b=>({name:b.name,values:[b.stats.meta,b.stats.google]})).sort((a,b)=>(b.values[0]+b.values[1])-(a.values[0]+a.values[1]));
  const tt=B.map(b=>({name:b.name,values:[b.stats.yt_tamil,b.stats.yt_telugu]})).sort((a,b)=>(b.values[0]+b.values[1])-(a.values[0]+a.values[1]));
  const metaShare=B.map(b=>({name:b.name,value:b.stats.meta,color:BRAND_C[b.name]}));
  return `<div class="kg">${big('9','brands tracked')}${big(nf(sum('meta')),'Meta ads',{sub:nf(sum('meta_tt'))+' in Tamil/Telugu'})}${big(nf(sum('google')),'Google ads',{sub:nf(sum('google_live'))+' live now'})}${big(nf(sum('yt_tamil'))+' / '+nf(sum('yt_telugu')),'YouTube ads in Tamil / Telugu')}${big(nf(B.reduce((s,b)=>s+b.stats.ig_creators,0)),'Instagram creators',{sub:nf(sum('ig_posts'))+' collab posts'})}</div>`+
  `<div class="vg vg2">
    ${card('Share of voice · ads per brand',grouped(sov,['Meta ads','Google ads'],['#f2552c','#45c4dc']),'Malabar runs more ads than the next three brands combined.')}
    ${card('Meta ad share',donut(metaShare),'Share of all 2,623 Meta ads.')}
    ${card('Who speaks Tamil vs Telugu · YouTube ads',grouped(tt,['Tamil','Telugu'],['#f2552c','#8b7cf6']),'Tamil dominates. Thangamayil is Tamil-only and Khazana is the only Telugu-led brand.')}
    ${card('How deep the discount goes',hbars(odl,{fmt:v=>v+'%'}),'Median offer % stated in Meta ad copy (making charges / wastage).')}
  </div>
  ${card('Creator collabs · boosted vs organic',stack100(verdRows,{n:4}),'Instagram collab posts by verdict. Boosted = views far above the creator\'s usual with a low like rate.','wide')}
  ${sec('What it means','The ten key findings. The full write-up is in the Research tab.',`<div class="ig">${P.insights.map((x,i)=>`<div class="ic2"><span class="nb">${i+1}</span><div><p class="ih">${esc(x.title.replace(/^\d+\.\s*/,''))}</p><p>${esc(x.body)}</p></div></div>`).join('')}</div>`)}
  ${sec('Brands at a glance','Click a brand to open its dashboard.',`<div class="bg">${B.map(b=>`<div class="bc" onclick="go('${esc(b.name)}')" style="--bc:${BRAND_C[b.name]}"><div class="bh"><b>${esc(b.name)}</b><span>${esc(b.approach)}</span></div><p>${esc(b.message)}</p><div class="bm"><span><b>${nf(b.stats.meta)}</b>Meta</span><span><b>${nf(b.stats.google)}</b>Google</span><span><b>${b.stats.yt_tamil}/${b.stats.yt_telugu}</b>Ta/Te</span><span><b>${b.stats.ig_creators}</b>creators</span></div><em>${esc(b.hero)}</em></div>`).join('')}</div>`)}
  ${sec('Sources & caveats','',fold('sources',`<div class="rc"><dl class="notes" style="margin:0">${P.notes.map(n=>`<dt>${esc(n.source)}</dt><dd>${esc(n.detail)}</dd>`).join('')}</dl></div>`))}`};

/* ---------- research: numbered cards ---------- */
research=async function(){const C=await load('cross');
  $('#title').textContent='Research: how South India jewellers advertise';
  $('#sub').textContent='A full analysis across 2,623 Meta ads, 22,135 Google ads, 2,829 YouTube videos, 298 creator collabs and 950 boosted-YouTube candidates.';
  return `<div class="rs">${C.research.map((r,i)=>`<section class="rsc"><div class="rsn">${String(i+1).padStart(2,'0')}</div><div><h2>${esc(r.h.replace(/^\d+\.\s*/,''))}</h2><ul>${r.p.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></section>`).join('')}</div>`};

/* ---------- cross-brand ---------- */
const mrows=m=>m.cols.map((b,j)=>({name:b,segs:m.rows.map(r=>({name:r[0],value:r[j+1]}))}));
crossView=async function(){const C=await load('cross'),M=C.meta_matrix;
  $('#title').textContent='Cross-brand comparison';$('#sub').textContent='Every brand side by side. Each bar is one brand\'s ads split 100%; hover a segment for the count.';
  const gm=C['New ads by month'],labels=gm.cols.slice(1);const gser=gm.rows.map((r,i)=>({name:r[0],color:PAL[i%PAL.length],values:r.slice(1).map(v=>v||0)}));
  const mm=C.meta_month,mrev=mm.rows.slice(-18);const mser=mm.cols.map((b,j)=>({name:b,color:BRAND_C[b],values:mrev.map(r=>r[j+1])}));
  const ag=C.Agencies,agi=c=>ag.cols.indexOf(c);const agRows=[...new Set(ag.rows.map(r=>r[0]))].map(b=>({name:b,segs:ag.rows.filter(r=>r[0]===b).map(r=>({name:r[agi('Paid by')],value:r[agi('Ads')]}))}));
  return `<div class="vg vg2">
   ${card('What they talk about · Meta themes',stack100(mrows(M['Themes']),{n:7}),'One ad can carry several themes.')}
   ${card('What they ask you to do · CTA buttons',stack100(mrows(M['CTA Button']),{n:6}))}
   ${card('Where the click goes · landing pages',stack100(mrows(M['Landing Page Type']),{n:6}))}
   ${card('Which format · Meta ad formats',stack100(mrows(M['Format']),{n:6}))}
   ${card('Which moment · festival hooks',stack100(mrows(M['Festival']),{n:5}),'Only ads with a festival tag.')}
   ${card('Who pays · Google ad agencies',stack100(agRows,{n:8}),'From Google Ads Transparency "Paid by".')}
  </div>
  ${card('Google: new ads launched per month',lines(labels,gser),'Malabar is still accelerating into the festive season.','wide')}
  ${card('Meta: ads started per month (still in the library)',lines(mrev.map(r=>r[0]),mser),'','wide')}
  ${sec('Raw tables','Every number behind the charts.',fold('raw tables',[['Meta summary','Meta Ad Library summary'],['Brand overview','Google brand overview'],['Ad type mix','Google ad type mix'],['Themes % (all ads)','Google themes %'],['Video languages','Google video languages'],['Agencies','Agencies'],['IG overview','Instagram creator overview'],['YouTube benchmarks','YouTube benchmarks'],['QC','Data quality']].map(([k,t])=>plain(C[k],t,'')).join('')+heat(M['Themes'],'Meta themes (counts)','')+heat(M['CTA Button'],'Meta CTA (counts)','')))}`};

/* ---------- brand: summary ---------- */
summary=function(b,D){const s=b.stats,F=b.fields,ex=b.examples.filter(e=>st.lang==='All'||e.language===st.lang);
  const m=D.meta,mi=c=>m.cols.indexOf(c);const p=D.posts,pi=c=>p.cols.indexOf(c);
  const verd=countBy(p.rows,pi('Boost Verdict')).map(x=>({...x,color:VERD_C[x.name]}));
  const gm=D.g_month.rows.length?D.g_month.cols.slice(1).map((c,i)=>[c.slice(2),D.g_month.rows.reduce((t,r)=>t+(+r[i+1]||0),0)]):[];
  const c=BRAND_C[b.name];
  return `<div class="kg">${big(nf(s.meta),'Meta ads',{go:"setView('instagram','ads')",sub:nf(s.meta_tt)+' in Tamil/Telugu'})}${big(nf(s.google),'Google ads',{go:"setView('google')",sub:nf(s.google_live)+' live now'})}${big(s.yt_tamil+' / '+s.yt_telugu,'YouTube ads Tamil / Telugu',{go:"setView('youtube')"})}${big(nf(D.creators.length),'Instagram creators',{go:"setView('instagram','creators')",sub:nf(s.ig_posts)+' posts · '+s.ig_boosted+' boosted'})}</div>
  <div class="tk" style="--bc:${c}"><div><span>Signature line</span><p class="sig">${esc(F.signature)}</p></div><div><span>So what for us</span><p>${esc(F.sowhat)}</p></div></div>
  <div class="vg vg3">
    ${card('What they talk about',hbars(b.themes,{color:c}),'Meta ad themes')}
    ${card('What they ask',donut(b.ctas),'Meta CTA buttons')}
    ${card('Where the click goes',donut(b.landing),'Meta landing pages')}
    ${card('Language on YouTube',donut(b.yt_languages),'Google video ads by spoken language')}
    ${card('Creator collabs',donut(verd),'Boosted vs organic Instagram collabs')}
    ${card('Festival hooks',b.festivals.length?donut(b.festivals):'<p class="vs">No festival-tagged Meta ads.</p>','Meta ads tagged with a festival')}
  </div>
  ${gm.length?card('New Google ads per month',columns(gm,{color:c}),'','wide'):''}
  ${sec('Key findings','',`<div class="ig">${D.notes.map((x,i)=>`<div class="ic2"><span class="nb" style="background:${c}">${i+1}</span><div><p>${esc(x)}</p></div></div>`).join('')}</div>`)}
  ${sec('Playbook','',`<div class="pb">${PB.map(([k,h])=>`<div class="pbc"><h3>${h}</h3><p>${esc(F[k])}</p></div>`).join('')}</div>`)}
  ${sec('Best regional examples','The highest-reach Tamil and Telugu ads.',`<div class="seg" style="margin-bottom:12px">${['All','Tamil','Telugu'].map(l=>`<button class="${st.lang===l?'on':''}" onclick="st.lang='${l}';rerender()">${l}</button>`).join('')}</div>
    <div class="exg">${ex.length?ex.map(e=>`<div class="exc"><div class="meta"><span class="chip l">${esc(e.language)}</span><span class="chip">${esc(e.channel)}</span>${e.views!=null?`<b>${short(e.views)} views</b>`:''}</div>${e.title?`<h4>${esc(e.title)}</h4>`:''}<p>${esc(e.english.slice(0,260))}${e.english.length>260?'…':''}</p>${e.url?`<a href="${esc(e.url)}" target="_blank" rel="noopener">Watch ↗</a>`:''}</div>`).join(''):`<p class="vs">No transcribed ${st.lang==='All'?'':st.lang+' '}ads for this brand.</p>`}</div>`)}`};

/* ---------- brand: meta ---------- */
const _metaTable=metaView;
metaView=function(b,D){const m=D.meta,i=c=>m.cols.indexOf(c),R=m.rows,c=BRAND_C[b.name];
  const act=R.filter(r=>r[i('Status')]==='Active').length,reg=R.filter(r=>/Tamil|Telugu/.test((r[i('Caption Language')]||'')+(r[i('Spoken Language (video)')]||''))).length;
  const days=R.map(r=>r[i('Days Running')]).filter(x=>x!=null).sort((a,b)=>a-b);
  const bins=[[0,7,'≤1 wk'],[8,30,'1–4 wk'],[31,60,'1–2 mo'],[61,120,'2–4 mo'],[121,9999,'4 mo+']].map(([a,z,l])=>[l,days.filter(d=>d>=a&&d<=z).length]);
  const mo={};R.forEach(r=>{const k=String(r[i('Started')]||'').slice(0,7);if(k)mo[k]=(mo[k]||0)+1});const mon=Object.entries(mo).sort().slice(-14).map(([k,v])=>[k.slice(2),v]);
  const offers=R.map(r=>r[i('Offer %')]).filter(x=>x!=null);
  return `<div class="kg">${big(nf(R.length),'Meta ads',{sub:nf(act)+' active'})}${big(nf(reg),'in Tamil / Telugu')}${big(nf(R.filter(r=>r[i('Creator Partnership')]==='Yes').length),'creator-partnership ads')}${big((days[days.length>>1]??'–')+' d','median days running',{sub:'longest '+(days[days.length-1]??'–')+' d'})}${big(offers.length?Math.round(offers.sort((a,b)=>a-b)[offers.length>>1])+'%':'–','median stated offer',{sub:nf(offers.length)+' ads state a %'})}</div>
  <div class="vg vg3">
   ${card('Format',donut(countBy(R,i('Format'))))}${card('Caption language',donut(countBy(R,i('Caption Language'))))}${card('Spoken language (videos)',donut(countBy(R,i('Spoken Language (video)'))))}
   ${card('CTA button',hbars(countBy(R,i('CTA Button')).slice(0,7),{color:c}))}${card('Landing page',hbars(countBy(R,i('Landing Page Type')).slice(0,7),{color:c}))}${card('How long ads run',columns(bins,{color:c,h:120,every:1}))}
  </div>
  ${card('Ads started per month',columns(mon,{color:c,every:1}),'Ads still visible in the Ad Library, by start month.','wide')}
  ${D.meta_creators.length?card('Creators in paid partnership ads',hbars(D.meta_creators.sort((a,b)=>b.ads-a.ads).slice(0,15).map(x=>({name:x.page,value:x.ads})),{color:c}),'Number of "<creator> with <brand>" ads.','wide'):''}
  ${sec('Every Meta ad','Search, filter, sort; click a row for the full caption, transcript, UTM and landing URL.',table({id:'meta-'+slug(b.name),cols:m.cols,rows:R,
   show:['Status','Started','Days Running','Format','Caption Language','Spoken Language (video)','Hook (first line)','CTA Button','Landing Page Type','Offer %','Festival','Themes','Ad Library Link'],
   num:['Days Running','Offer %'],clip:['Hook (first line)','Themes'],link:'Ad Library Link',filters:['Status','Format','Caption Language','Spoken Language (video)','CTA Button','Landing Page Type','Festival','Themes','Creator Partnership']}))}`};

/* ---------- brand: creators ---------- */
const _creatorsTables=creatorsView;
creatorsView=function(b,D){const C=D.creators,p=D.posts,pi=c=>p.cols.indexOf(c),c=BRAND_C[b.name];
  const verd=countBy(p.rows,pi('Boost Verdict')).map(x=>({...x,color:VERD_C[x.name]}));
  const tiers=['Mega','Macro','Mid','Micro','Nano'].map(t=>({name:t,value:C.filter(x=>x.tier===t).length})).filter(x=>x.value);
  const langs=countBy(p.rows,pi('Lang'));
  const pts=p.rows.map(r=>({x:r[pi('Followers')],y:r[pi('Views')],r:4+Math.min(10,Math.sqrt((r[pi('Likes')]||0)/2000)),color:VERD_C[r[pi('Boost Verdict')]]||'#a7a39d',label:`${r[pi('Creator')]} · ${short(r[pi('Followers')])} followers · ${short(r[pi('Views')])} views · ${r[pi('Boost Verdict')]}`}));
  const totv=C.reduce((s,x)=>s+(x.views||0),0);
  return `<div class="kg">${big(nf(C.length),'unique creators',{sub:nf(p.rows.length)+' collab posts'})}${big(short(totv),'views on collab posts')}${big(nf((verd.find(x=>x.name==='Likely boosted')||{}).value||0),'likely boosted',{sub:nf((verd.find(x=>x.name==='Possibly boosted')||{}).value||0)+' possibly'})}${big(nf(D.creator_ads?D.creator_ads.rows.length:0),'paid creator ads on Meta',{sub:'with transcripts'})}</div>
  <div class="vg vg3">${card('Boost verdict',donut(verd),'Each post vs the creator\'s own last 10 reels.')}${card('Creator size',donut(tiers),'Nano <10K · Micro <50K · Mid <100K · Macro <1M · Mega 1M+')}${card('Reel language',donut(langs))}</div>
  ${card('Followers vs views, one dot per collab post',scatter(pts,{xl:'creator followers',yl:'post views'})+`<div class="lgh">${Object.entries(VERD_C).map(([k,v])=>`<span><i style="background:${v}"></i>${k}</span>`).join('')}</div>`,'Dots high above the crowd got far more views than the creator\'s audience size predicts. Orange ones (low like rate) were boosted. Dot size = likes.','wide')}
  ${card('Top creators by views',hbars(C.slice(0,12).map(x=>({name:x.creator,value:x.views||0,color:VERD_C[Object.keys(x.verdicts)[0]]||c})),{fmt:short}),'Colour = verdict of their first collab.','wide')}
  ${_creatorsTables(b,D).replace(/<section class="rg4"[\s\S]*?<\/section>/,'')}`};

/* ---------- brand: google ---------- */
const _googleTables=googleView;
googleView=function(b,D){const c=BRAND_C[b.name];
  const mix=D.g_mix.rows.length?D.g_mix.cols.slice(1,-1).map((k,i)=>({name:k,value:D.g_mix.rows.reduce((t,r)=>t+(+r[i+1]||0),0)})).filter(x=>x.value):[];
  const lang=D.g_lang.rows.length?D.g_lang.cols.slice(1).map((k,i)=>({name:k,value:D.g_lang.rows.reduce((t,r)=>t+(+r[i+1]||0),0)})).filter(x=>x.value).sort((a,b)=>b.value-a.value):[];
  const gm=D.g_month.rows.length?D.g_month.cols.slice(1).map((k,i)=>[k.slice(2),D.g_month.rows.reduce((t,r)=>t+(+r[i+1]||0),0)]):[];
  const th=D.g_themes.rows.length?D.g_themes.cols.slice(1).map((k,i)=>({name:k,value:Math.max(...D.g_themes.rows.map(r=>r[i+1]||0))})).filter(x=>x.value).sort((a,b)=>b.value-a.value):[];
  const ag=D.g_agencies,ai=k=>ag.cols.indexOf(k);const agl=ag.rows.map(r=>({name:r[ai('Paid by')],value:r[ai('Ads')]})).sort((a,b)=>b.value-a.value);
  const yt=D.yt,yi=k=>yt.cols.indexOf(k);const topv=yt.rows.slice(0,8).map(r=>({name:(r[yi('YouTube title')]||'').slice(0,60),value:r[yi('Views')]||0}));
  const O=D.g_overview,oi=k=>O.cols.indexOf(k),sumO=k=>O.rows.reduce((s,r)=>s+(Number(r[oi(k)])||0),0);
  return `<div class="kg">${big(nf(sumO('Total ads')),'Google ads',{sub:nf(sumO('Live now (≤7d)'))+' live now'})}${big(nf(yt.rows.length),'YouTube videos used in ads')}${big(short(yt.rows.reduce((s,r)=>s+(r[yi('Views')]||0),0)),'YouTube views on those videos')}${big(nf(D.maps.rows.length),'stores promoted on Maps')}</div>
  <div class="vg vg3">${card('Ad type mix',donut(mix))}${card('Spoken language in video ads',donut(lang))}${card('Who pays',donut(agl))}</div>
  <div class="vg vg2">${card('New Google ads per month',columns(gm,{color:c}))}${card('Themes, % of ads',hbars(th,{fmt:v=>v+'%',color:c}))}</div>
  ${card('Most-watched YouTube ads',hbars(topv,{fmt:short,color:c}),'','wide')}
  ${sec('All Google data','YouTube videos with transcripts, every search, display and Maps ad.',fold('all Google tables',_googleTables(b,D)))}`};

/* ---------- brand: boosted youtube ---------- */
const _boostedTables=boostedView;
boostedView=function(b,D){const y=D.ya,i=k=>y.cols.indexOf(k),c=BRAND_C[b.name];
  return `<div class="kg">${big(nf(y.rows.length),'boosted Tamil/Telugu videos')}${big(short(y.rows.reduce((s,r)=>s+(r[i('View Count')]||0),0)),'total views')}${big(nf(y.rows.filter(r=>r[i('Format')]==='YouTube Short').length),'Shorts',{sub:nf(y.rows.filter(r=>r[i('Format')]!=='YouTube Short').length)+' long-form'})}</div>
  <div class="vg vg2">${card('Language',donut(countBy(y.rows,i('Language'))))}${card('Campaign focus (audit tag)',donut(countBy(y.rows,i('Campaign Focus'))),'Coarse third-party tags.')}</div>
  ${card('Top campaigns by views',hbars(y.rows.slice(0,10).map(r=>({name:String(r[i('Campaign Title')]).slice(0,70),value:r[i('View Count')]||0})),{fmt:short,color:c}),'','wide')}
  ${sec('Benchmark & every campaign','',fold('benchmark and campaign list',_boostedTables(b,D)))}`};


/* ---------- platform picker: Overview | Instagram & Facebook | YouTube | Google ---------- */
const PLATS=[['summary','Overview','◎'],['instagram','Instagram & Facebook','◐'],['youtube','YouTube','▶'],['google','Google Search & Display','G']];
const LEGACY={meta:['instagram','ads'],creators:['instagram','creators'],boosted:['youtube',null]};
setView=function(v,sub){if(LEGACY[v]){[v,sub]=[LEGACY[v][0],sub||LEGACY[v][1]]}st.view=v;if(sub)st.sub=sub;save();render();const s=$('#subnav');if(s)s.scrollIntoView({behavior:'smooth',block:'start'})};
go=function(t,view){st.tab=t;st.view='summary';st.lang='All';if(view){const l=LEGACY[view];st.view=l?l[0]:view;if(l&&l[1])st.sub=l[1]}save();render();window.scrollTo({top:0,behavior:'smooth'})};
if(LEGACY[st.view]){const l=LEGACY[st.view];st.view=l[0];if(l[1])st.sub=l[1]}
if(!PLATS.some(p=>p[0]===st.view))st.view='summary';
subnav=function(b,D){const yi=k=>D.yt.cols.indexOf(k);
  const cnt={instagram:D.meta.rows.length+D.posts.rows.length,youtube:D.yt.rows.length+D.ya.rows.length,google:D.search.rows.length+D.display.rows.length+D.maps.rows.length};
  return `<div class="plat">${PLATS.map(([k,l,ic])=>`<button class="${st.view===k?'on':''}" onclick="setView('${k}')"><i>${ic}</i><span>${l}</span>${cnt[k]!=null?`<em>${nf(cnt[k])}</em>`:''}</button>`).join('')}</div>`};

function instagramView(b,D){const sub=st.sub==='creators'?'creators':'ads';
  const pick=`<div class="seg" style="margin:4px 0 6px">${[['ads',`Paid Meta ads (${nf(D.meta.rows.length)})`],['creators',`Creator collabs (${nf(D.creators.length)} creators)`]].map(([k,l])=>`<button class="${sub===k?'on':''}" onclick="st.sub='${k}';save();rerender()">${l}</button>`).join('')}</div>
   <p class="vs" style="margin-bottom:0">${sub==='ads'?'Every ad in the Meta Ad Library (runs on Instagram and Facebook), including paid creator-partnership ads.':'Instagram posts the brand co-authored with creators, benchmarked against each creator\'s own reels, plus the transcripts of paid creator ads.'}</p>`;
  return pick+(sub==='ads'?metaView(b,D):creatorsView(b,D))}

function youtubeView(b,D){const c=BRAND_C[b.name],y=D.yt,yi=k=>y.cols.indexOf(k),R=y.rows,a=D.ya,ai=k=>a.cols.indexOf(k);
  const tv=R.reduce((s,r)=>s+(r[yi('Views')]||0),0),live=R.filter(r=>/yes|true/i.test(String(r[yi('Live (≤7 days)')]))).length;
  const lang=countBy(R,yi('Spoken language')).map(x=>({...x,name:x.name.replace(/—/g,'').trim()}));
  const lenB=[[0,15,'≤15s'],[16,30,'16–30s'],[31,60,'31–60s'],[61,180,'1–3 min'],[181,1e9,'3 min+']].map(([lo,hi,l])=>[l,R.filter(r=>{const v=r[yi('Length (sec)')];return v!=null&&v>=lo&&v<=hi}).length]);
  const mo={};R.forEach(r=>{const k=String(r[yi('First shown')]||'').slice(0,7);if(k)mo[k]=(mo[k]||0)+1});const mon=Object.entries(mo).sort().slice(-16).map(([k,v])=>[k.slice(2),v]);
  const th=countBy(R,yi('Themes'),true).slice(0,8);
  const ta=R.filter(r=>/Tamil|Telugu/.test(r[yi('Spoken language')]||'')).slice(0,8).map(r=>({name:`${r[yi('Spoken language')]} · ${String(r[yi('YouTube title')]||'').slice(0,55)}`,value:r[yi('Views')]||0}));
  return `<div class="kg">${big(nf(R.length),'YouTube videos run as Google ads',{sub:nf(live)+' shown in the last 7 days'})}${big(short(tv),'YouTube views on those videos')}${big(b.stats.yt_tamil+' / '+b.stats.yt_telugu,'spoken in Tamil / Telugu')}${big(nf(a.rows.length),'boosted regional videos',{sub:'third-party audit'})}</div>
  <div class="vg vg3">${card('Spoken language',donut(lang))}${card('Video length',columns(lenB,{color:c,h:120,every:1}))}${card('What the videos talk about',hbars(th,{color:c}))}</div>
  ${card('Most-watched Tamil & Telugu video ads',hbars(ta,{fmt:short,color:c}),'','wide')}
  ${card('New YouTube video ads per month',columns(mon,{color:c,every:1}),'By the month Google first showed the video as an ad.','wide')}
  ${sec('Every YouTube video ad','Open a row for the transcript in the original language and in English.',table({id:'yt-'+slug(b.name),cols:y.cols,rows:R,
     show:['YouTube title','Spoken language','Views','Length (sec)','Ad creatives using it','First shown','Last shown','Live (≤7 days)','Themes','YouTube URL'],num:['Views','Length (sec)','Ad creatives using it'],clip:['YouTube title','Themes'],link:'YouTube URL',filters:['Spoken language','Live (≤7 days)','Themes']}))}
  <div class="divider"><span>Boosted regional videos · third-party audit</span></div>
  ${boostedView(b,D)}`}

function googleOnlyView(b,D){const c=BRAND_C[b.name];
  const notYT=k=>!/YouTube|Video/i.test(k);
  const mix=D.g_mix.rows.length?D.g_mix.cols.slice(1,-1).map((k,i)=>({name:k,value:D.g_mix.rows.reduce((t,r)=>t+(+r[i+1]||0),0)})).filter(x=>x.value&&notYT(x.name)):[];
  const th=D.g_themes.rows.length?D.g_themes.cols.slice(1).map((k,i)=>({name:k,value:Math.max(...D.g_themes.rows.map(r=>r[i+1]||0))})).filter(x=>x.value).sort((a,b)=>b.value-a.value):[];
  const ag=D.g_agencies,ai=k=>ag.cols.indexOf(k);const agl=ag.rows.map(r=>({name:r[ai('Paid by')],value:r[ai('Ads')]})).sort((a,b)=>b.value-a.value);
  const gm=D.g_month.rows.length?D.g_month.cols.slice(1).map((k,i)=>[k.slice(2),D.g_month.rows.reduce((t,r)=>t+(+r[i+1]||0),0)]):[];
  const S=D.search,si=k=>S.cols.indexOf(k),topS=S.rows.slice(0,8).map(r=>({name:String(r[si('Ad text')]||'').slice(0,70),value:r[si('Creatives')]}));
  const M=D.maps,mi=k=>M.cols.indexOf(k),topM=M.rows.slice(0,10).map(r=>({name:String(r[mi('Store / location')]||'').slice(0,50),value:r[mi('Ads')]}));
  const s=slug(b.name);
  return `<div class="kg">${big(nf(mix.reduce((t,x)=>t+x.value,0)),'Google search, shopping, display & Maps ads')}${big(nf(S.rows.length),'unique search / shopping ads')}${big(nf(D.display.rows.length),'unique display banners')}${big(nf(M.rows.length),'stores promoted on Maps')}</div>
  <div class="vg vg3">${card('Ad type',donut(mix),'Excludes YouTube (see the YouTube tab).')}${card('Who pays',donut(agl),'Google "Paid by" (all Google ads)')}${card('Themes, % of ads',hbars(th.slice(0,8),{fmt:v=>v+'%',color:c}))}</div>
  ${card('New Google ads per month',columns(gm,{color:c}),'All Google formats, including YouTube.','wide')}
  <div class="vg vg2">${card('Most-used search ad texts',hbars(topS,{color:c}),'Number of Google creatives using the exact text.')}${card('Stores promoted on Google Maps',topM.length?hbars(topM,{color:c}):'<p class="vs">No Maps ads.</p>')}</div>
  ${sec('Every search & shopping ad','Deduplicated by ad text.',table({id:'se-'+s,cols:S.cols,rows:S.rows,show:['Ad text','Creatives','Type','Themes','First shown','Last shown','Live creatives','Paid by'],num:['Creatives','Live creatives'],clip:['Ad text','Themes'],filters:['Type','Themes','Paid by']}))}
  ${sec('Every display banner','Text read from the banner, deduplicated.',table({id:'di-'+s,cols:D.display.cols,rows:D.display.rows,show:['Ad text','Creatives','Themes','First shown','Last shown','Text quality','Transparency link'],num:['Creatives'],clip:['Ad text','Themes'],link:'Transparency link',filters:['Themes','Text quality']}))}
  ${sec('Every Maps / local store ad','',table({id:'mp-'+s,cols:M.cols,rows:M.rows,show:['Store / location','Ads','First shown','Last shown','Ad text'],num:['Ads'],clip:['Ad text']}))}
  ${sec('Google overview & raw tables','',fold('Google tables',gTable(D.g_overview)+'<br>'+gTable(D.g_themes)+'<br>'+gTable(D.g_agencies)))}`}

brandView=async function(b,tok){const D=await load(slug(b.name));if(tok!==RTOK)return null;
  $('#title').textContent=b.name;$('#sub').textContent=b.approach+' · '+b.message;
  $('#subnav').innerHTML=subnav(b,D);
  return ({summary,instagram:instagramView,youtube:youtubeView,google:googleOnlyView}[st.view]||summary)(b,D)};

/* ---------- render (overview is async now) ---------- */
render=async function(keep){try{localStorage.setItem('regional-st',JSON.stringify({tab:st.tab,view:st.view,sub:st.sub}))}catch(e){}
  const tok=++RTOK;
  $('#btabs').innerHTML=TABS.map(t=>`<button class="${st.tab===t?'on':''}" onclick="go('${esc(t)}')" ${BRAND_C[t]?`style="--bc:${BRAND_C[t]}"`:''}>${BRAND_C[t]?'<i class="bd"></i>':''}${esc(t)}</button>`).join('');
  $('#subnav').innerHTML='';if(!keep)$('#body').innerHTML='<div class="loading">Loading…</div>';
  try{const html=st.tab==='Overview'?await overview():st.tab==='Research'?await research():st.tab==='Cross-brand data'?await crossView():await brandView(P.brands.find(b=>b.name===st.tab),tok);
    if(tok!==RTOK||html==null)return;$('#body').innerHTML=html}
  catch(e){$('#body').innerHTML=`<div class="loading">Could not load data (${esc(e.message)}).</div>`}};
render();
