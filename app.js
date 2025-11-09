/* FLOW v8 — soma familiar + scroll de menu + SVG logo */
const LS={ entradas:"flow:v8:entradas",despesas:"flow:v8:despesas",metas:"flow:v8:metas",parcelas:"flow:v8:parcelas",config:"flow:v8:config" };
const qs=(s,el=document)=>el.querySelector(s); const qsa=(s,el=document)=>[...el.querySelectorAll(s)];
const state={ entradas:[], despesas:[], metas:[], parcelas:[], config:{ dizimo:10, investMax:30 } };

function money(n){ return Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function uid(){ return Math.random().toString(36).slice(2,9); }
function mstr(){ return qs('#filterMonth').value || new Date().toISOString().slice(0,7); }
function ownerFilter(){ return qs('#filterOwner').value; }
function filterByOwner(arr){ const o=ownerFilter(); return o==='familia'?arr:arr.filter(x=>(x.owner||'Família')===o); }

function saveAll(){ localStorage.setItem(LS.entradas,JSON.stringify(state.entradas));
  localStorage.setItem(LS.despesas,JSON.stringify(state.despesas));
  localStorage.setItem(LS.metas,JSON.stringify(state.metas));
  localStorage.setItem(LS.parcelas,JSON.stringify(state.parcelas));
  localStorage.setItem(LS.config,JSON.stringify(state.config)); }
function loadAll(){
  try{ state.entradas=JSON.parse(localStorage.getItem(LS.entradas)||"[]"); }catch{}
  try{ state.despesas=JSON.parse(localStorage.getItem(LS.despesas)||"[]"); }catch{}
  try{ state.metas=JSON.parse(localStorage.getItem(LS.metas)||"[]"); }catch{}
  try{ state.parcelas=JSON.parse(localStorage.getItem(LS.parcelas)||"[]"); }catch{}
  try{ state.config=Object.assign(state.config, JSON.parse(localStorage.getItem(LS.config)||"{}")); }catch{}
  if(state.metas.length===0) seedMetas();
  if(state.parcelas.length===0) seedParcelas();
}
function seedMetas(){
  state.metas=[
    {id:uid(), nome:"Serasa — Claro", alvo:325.52, ate:"", pago:0},
    {id:uid(), nome:"Serasa — Shopee", alvo:173.59, ate:"", pago:0},
    {id:uid(), nome:"13º Thiago", alvo:5000.00, ate:"", pago:0},
    {id:uid(), nome:"Viagem fim de ano", alvo:2500.00, ate:"", pago:0},
    {id:uid(), nome:"Reserva emergencial", alvo:3000.00, ate:"", pago:0}
  ]; saveAll();
}
function seedParcelas(){
  state.parcelas=[
    { id:uid(), nome:"Ailos (acordo — não conta corrente)", parcela:196.63, total:25, pagas:2 },
    { id:uid(), nome:"Carro", parcela:767.32, total:48, pagas:22 }
  ]; saveAll();
}
function monthFilter(list, key){ const m=mstr(); return list.filter(x => (x[key]||"").startsWith(m)); }

function totalsEntradas(){
  const arr = monthFilter(state.entradas,'date');
  const rate = (state.config?.dizimo||10)/100;
  let bruto=0,diz=0,liq=0, thi=0, adr=0;
  arr.forEach(e=>{ bruto+=e.entrada; const dz=+(e.entrada*rate).toFixed(2), lq=+(e.entrada-dz).toFixed(2); diz+=dz; liq+=lq; if(e.owner==='Thiago') thi+=lq; if(e.owner==='Adriele') adr+=lq; });
  return {bruto,diz,liq,thi,adr};
}
function totalsDespesas(){
  const arr = monthFilter(state.despesas,'date');
  const total = arr.reduce((s,x)=>s+x.valor,0);
  const fixas = arr.filter(x=>x.kind==='fixa').reduce((s,x)=>s+x.valor,0);
  const shopee = arr.filter(x=>(x.categoria||'').toLowerCase()==='shopee').reduce((s,x)=>s+x.valor,0);
  const variaveis = total - fixas;
  return {total,fixas,variaveis,shopee};
}
function saldoMes(){ const e=totalsEntradas(), d=totalsDespesas(); return {...e,...d,saldo:e.liq-d.total}; }

function renderEntradas(){
  const wrap=qs('#listaEntradas'); wrap.innerHTML='';
  const rate=(state.config?.dizimo||10)/100;
  const arr=filterByOwner(monthFilter(state.entradas,'date')).sort((a,b)=>a.date.localeCompare(b.date));
  arr.forEach(e=>{
    const dz=+(e.entrada*rate).toFixed(2), lq=+(e.entrada-dz).toFixed(2);
    const rest=Math.max(0, +(e.total-e.entrada).toFixed(2)); const pct=e.total>0?Math.round((e.entrada/e.total)*100):0;
    const el=document.createElement('div'); el.className='item';
    el.innerHTML=`<div class="top"><strong>${e.owner} — ${e.cliente}</strong>
      <div class="actions"><button class="mini">Editar</button><button class="mini danger">Excluir</button></div></div>
      <div class="meta"><span class="badge">${e.date}</span><span class="badge">${e.forma}</span></div>
      <div class="meta"><span>Total serviço: <b>${money(e.total)}</b></span><span>Entrada: <b>${money(e.entrada)}</b></span><span>Resta: <b>${money(rest)}</b></span><span>Recebido: <b>${pct}%</b></span></div>
      <div class="meta"><span>Dízimo (${Math.round(rate*100)}%): <b>${money(dz)}</b></span><span>Líquido: <b class="amt">${money(lq)}</b></span></div>`;
    el.querySelector('.danger').addEventListener('click',()=>{ if(confirm('Excluir entrada?')){ state.entradas=state.entradas.filter(x=>x.id!==e.id); saveAll(); renderAll(); } });
    el.querySelector('.mini:not(.danger)').addEventListener('click',()=>{
      el.innerHTML=`<form class="col">
        <select><option ${e.owner==='Thiago'?'selected':''}>Thiago</option><option ${e.owner==='Adriele'?'selected':''}>Adriele</option></select>
        <input value="${e.cliente}" required><input value="${e.forma}" required><input type="date" value="${e.date}" required>
        <input type="number" step="0.01" value="${e.total}" required><input type="number" step="0.01" value="${e.entrada}" required>
        <div class="actions"><button class="mini primary">Salvar</button><button class="mini">Cancelar</button></div></form>`;
      const [owner,cli,forma,date,total,ent]=el.querySelectorAll('select,input');
      el.querySelector('.primary').addEventListener('click',(ev)=>{ev.preventDefault(); e.owner=owner.value; e.cliente=cli.value.trim(); e.forma=forma.value.trim(); e.date=date.value; e.total=Number(total.value||0); e.entrada=Number(ent.value||0); saveAll(); renderAll();});
      el.querySelector('.mini:not(.primary)').addEventListener('click',(ev)=>{ev.preventDefault(); renderAll();});
    });
    wrap.appendChild(el);
  });
  const t=totalsEntradas(); qs('#entBruto').textContent=money(t.bruto); qs('#entDizimo').textContent=money(t.diz); qs('#entLiquido').textContent=money(t.liq); qs('#entThiago').textContent=money(t.thi); qs('#entAdriele').textContent=money(t.adr);
}

function renderDespesas(){
  const wrap=qs('#listaDespesas'); wrap.innerHTML='';
  const arr=filterByOwner(monthFilter(state.despesas,'date')).sort((a,b)=>a.date.localeCompare(b.date));
  arr.forEach(d=>{
    const el=document.createElement('div'); el.className='item';
    el.innerHTML=`<div class="top"><strong>${d.owner||'Família'} — ${d.categoria}</strong>
      <div class="actions"><button class="mini">Editar</button><button class="mini danger">Excluir</button></div></div>
      <div class="meta"><span class="badge">${d.date}</span><span class="badge">${d.kind==='fixa'?'Fixa':'Variável'}</span></div>
      <div class="meta"><span class="amt">${money(d.valor)}</span><span>${d.obs||''}</span></div>`;
    el.querySelector('.danger').addEventListener('click',()=>{ if(confirm('Excluir despesa?')){ state.despesas=state.despesas.filter(x=>x.id!==d.id); saveAll(); renderAll(); } });
    el.querySelector('.mini:not(.danger)').addEventListener('click',()=>{
      el.innerHTML=`<form class="col">
        <select><option ${d.owner==='Família'?'selected':''}>Família</option><option ${d.owner==='Thiago'?'selected':''}>Thiago</option><option ${d.owner==='Adriele'?'selected':''}>Adriele</option></select>
        <input type="date" value="${d.date}" required><input value="${d.categoria}" required>
        <select><option value="fixa" ${d.kind==='fixa'?'selected':''}>Fixa</option><option value="variavel" ${d.kind==='variavel'?'selected':''}>Variável</option></select>
        <input type="number" step="0.01" value="${d.valor}" required><input value="${d.obs||''}" placeholder="Observação">
        <div class="actions"><button class="mini primary">Salvar</button><button class="mini">Cancelar</button></div></form>`;
      const [owner,date,cat,kind,val,obs]=el.querySelectorAll('select,input');
      el.querySelector('.primary').addEventListener('click',(ev)=>{ev.preventDefault(); d.owner=owner.value; d.date=date.value; d.categoria=cat.value; d.kind=kind.value; d.valor=Number(val.value||0); d.obs=obs.value; saveAll(); renderAll();});
      el.querySelector('.mini:not(.primary)').addEventListener('click',(ev)=>{ev.preventDefault(); renderAll();});
    });
    wrap.appendChild(el);
  });
  const t=totalsDespesas(); qs('#despTotal').textContent=money(t.total); qs('#despFixas').textContent=money(t.fixas); qs('#despVar').textContent=money(t.variaveis); qs('#despShopee').textContent=money(t.shopee);
}

function renderParcelas(){
  const wrap=qs('#listaParcelas'); wrap.innerHTML='';
  state.parcelas.forEach(p=>{
    const total=+(p.parcela*p.total).toFixed(2); const pago=+(p.parcela*(p.pagas||0)).toFixed(2); const rest=Math.max(0, +(total-pago).toFixed(2));
    const left=Math.max(0,(p.total-(p.pagas||0))); const pct=p.total>0?Math.round(((p.pagas||0)/p.total)*100):0;
    const el=document.createElement('div'); el.className='item';
    el.innerHTML=`<div class="top"><strong>${p.nome}</strong>
      <div class="actions"><button class="mini">Editar</button><button class="mini danger">Excluir</button></div></div>
      <div class="meta"><span class="badge">Parcela: ${money(p.parcela)}</span><span class="badge">Total: ${p.total}x</span><span class="badge">Pagas: ${p.pagas||0}x</span><span class="badge">Restantes: ${left}x</span></div>
      <div class="meta"><span>Total do contrato: <b>${money(total)}</b></span><span>Pago: <b>${money(pago)}</b></span><span>Restante: <b>${money(rest)}</b></span></div>
      <div class="progress"><div class="bar" style="width:${pct}%"></div></div>`;
    el.querySelector('.danger').addEventListener('click',()=>{ if(confirm('Excluir este parcelamento?')){ state.parcelas=state.parcelas.filter(x=>x.id!==p.id); saveAll(); renderAll(); }});
    el.querySelector('.mini:not(.danger)').addEventListener('click',()=>{
      el.innerHTML=`<form class="grid2">
        <input value="${p.nome}" required><input type="number" step="0.01" value="${p.parcela}" required>
        <input type="number" step="1" min="1" value="${p.total}" required><input type="number" step="1" min="0" value="${p.pagas||0}" required>
        <div class="actions"><button class="mini primary">Salvar</button><button class="mini">Cancelar</button></div></form>`;
      const [nome,parc,tot,pg]=el.querySelectorAll('input');
      el.querySelector('.primary').addEventListener('click',(ev)=>{ev.preventDefault(); p.nome=nome.value; p.parcela=Number(parc.value||0); p.total=parseInt(tot.value||0); p.pagas=parseInt(pg.value||0); saveAll(); renderAll();});
      el.querySelector('.mini:not(.primary)').addEventListener('click',(ev)=>{ev.preventDefault(); renderAll();});
    });
    wrap.appendChild(el);
  });
}

function renderResumo(){
  const s=saldoMes();
  qs('#kBruto').textContent=money(s.bruto); qs('#kDizimo').textContent=money(s.diz); qs('#kLiquido').textContent=money(s.liq);
  qs('#kDespesas').textContent=money(s.total); qs('#kSaldo').textContent=money(s.saldo);
  const disp=Math.max(0, s.liq-s.total); const max=state.config?.investMax||30;
  const pct = s.liq>0? Math.min(max, Math.floor((disp/s.liq)*100)):0; qs('#pctSug').textContent=pct+'%'; qs('#maxPct').textContent=max+'%';
  const range=qs('#pctRange'); range.max=String(max); range.value=pct;
  const upd=()=>{ qs('#valInvest').textContent=money((range.value/100)*s.liq); renderDistrib(range.value/100); };
  upd(); range.oninput=upd;
}

function renderMetas(){
  const wrap=qs('#metas'); wrap.innerHTML='';
  state.metas.forEach(m=>{
    const pago=m.pago||0; const pct=m.alvo>0? Math.min(100, Math.round((pago/m.alvo)*100)) : 0;
    const el=document.createElement('div'); el.className='item';
    el.innerHTML=`<div class="top"><strong>${m.nome}</strong><div class="actions"><button class="mini">Editar</button><button class="mini danger">Excluir</button></div></div>
      <div class="meta"><span class="badge">Alvo: ${money(m.alvo)}</span><span class="badge">Prazo: ${m.ate||'-'}</span><span class="badge">Acumulado: ${money(pago)}</span></div>
      <div class="progress"><div class="bar" style="width:${pct}%"></div></div>`;
    el.querySelector('.danger').addEventListener('click',()=>{ if(confirm('Excluir meta?')){ state.metas=state.metas.filter(x=>x.id!==m.id); saveAll(); renderAll(); }});
    el.querySelector('.mini:not(.danger)').addEventListener('click',()=>{
      el.innerHTML=`<form class="grid2">
        <input value="${m.nome}" required><input type="number" step="0.01" value="${m.alvo}" required>
        <input type="month" value="${m.ate||''}"><input type="number" step="0.01" value="${pago}" placeholder="Acumulado">
        <div class="actions"><button class="mini primary">Salvar</button><button class="mini">Cancelar</button></div></form>`;
      const [nome,alvo,ate,pagado]=el.querySelectorAll('input');
      el.querySelector('.primary').addEventListener('click',(ev)=>{ev.preventDefault(); m.nome=nome.value; m.alvo=Number(alvo.value||0); m.ate=ate.value; m.pago=Number(pagado.value||0); saveAll(); renderAll();});
      el.querySelector('.mini:not(.primary)').addEventListener('click',(ev)=>{ev.preventDefault(); renderAll();});
    });
    wrap.appendChild(el);
  });
}
function renderDistrib(fator){
  const s=saldoMes(); const invest=fator*s.liq;
  const distWrap=qs('#dist'); if(!distWrap) return; distWrap.innerHTML='';
  const order=['serasa','reserva','13','viagem'];
  const metas=[...state.metas].sort((a,b)=>{ const ia=order.findIndex(k=>a.nome.toLowerCase().includes(k)); const ib=order.findIndex(k=>b.nome.toLowerCase().includes(k)); return (ia<0?99:ia)-(ib<0?99:ib); });
  const needs=metas.map(m=>Math.max(0,(m.alvo||0)-(m.pago||0))); const totalNeed=needs.reduce((s,x)=>s+x,0)||1;
  metas.forEach((m,i)=>{ const share=invest*(needs[i]/totalNeed)*(1+(i===0?0.15:i===1?0.05:0)); const el=document.createElement('div'); el.className='item'; el.innerHTML=`<div class="top"><strong>${m.nome}</strong><strong>${money(share)}</strong></div>`; distWrap.appendChild(el); });
}

function exportBackup(){ const data={ entradas:state.entradas,despesas:state.despesas,metas:state.metas,parcelas:state.parcelas,config:state.config };
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})); a.download='flow-backup.json'; a.click(); }
function importBackup(){ const f=qs('#fileImport').files[0]; if(!f) return alert('Selecione um arquivo JSON.');
  const r=new FileReader(); r.onload=()=>{ try{ const o=JSON.parse(r.result); state.entradas=o.entradas||[]; state.despesas=o.despesas||[]; state.metas=o.metas||[]; state.parcelas=o.parcelas||[]; state.config=Object.assign(state.config,o.config||{}); saveAll(); renderAll(); alert('Backup importado!'); }catch{ alert('Arquivo inválido.'); } }; r.readAsText(f); }
function snapshotMes(){ const m=mstr(); const payload={ month:m, createdAt:new Date().toISOString(), entradas:monthFilter(state.entradas,'date'), despesas:monthFilter(state.despesas,'date'), metas:state.metas, parcelas:state.parcelas, config:state.config }; const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})); a.download=`${m}.json`; a.click(); }

let _drawer,_overlay,_btn;
function go(tab){
  const sec=document.getElementById('tab-'+tab);
  if(sec){ sec.scrollIntoView({behavior:'smooth', block:'start'}); }
  qsa('.tabs button').forEach(b=>{ const is=b.dataset.tab===tab; b.classList.toggle('active',is); b.setAttribute('aria-selected',String(is)); });
  closeDrawer();
}
function closeDrawer(){ _drawer.classList.remove('show'); _overlay.classList.remove('show'); _btn.setAttribute('aria-expanded','false'); _drawer.setAttribute('aria-hidden','true'); }

function openPDF(){ document.title='FLOW — Relatório ' + mstr(); window.print(); }
function applyConfigToUI(){ qs('#cfgDizimo').value=state.config?.dizimo??10; qs('#cfgInvestMax').value=state.config?.investMax??30; }
function saveConfig(){ state.config.dizimo=Number(qs('#cfgDizimo').value||10); state.config.investMax=Number(qs('#cfgInvestMax').value||30); saveAll(); renderAll(); alert('Configurações salvas.'); }

function addEntrada(ev){
  ev?.preventDefault();
  const e={ id:uid(), owner:qs('#eOwner').value, cliente:qs('#eCliente').value.trim(), forma:qs('#eForma').value.trim(), date:qs('#eDate').value, total:Number(qs('#eTotal').value||0), entrada:Number(qs('#eEntrada').value||0) };
  state.entradas.push(e); saveAll(); ev.target.reset(); qs('#eDate').valueAsDate=new Date(); renderAll();
}
function addEntradaQuick(ev){
  ev.preventDefault();
  const e={ id:uid(), owner:qs('#qOwner').value, cliente:qs('#qCliente').value.trim(), forma:qs('#qForma').value.trim(), date:qs('#qDate').value, total:Number(qs('#qTotal').value||0), entrada:Number(qs('#qEntrada').value||0) };
  state.entradas.push(e); saveAll(); ev.target.reset(); qs('#qDate').valueAsDate=new Date(); renderAll(); go('entradas');
}
function addDespesa(ev){
  ev.preventDefault();
  const d={ id:uid(), owner:qs('#dOwner').value, date:qs('#dDate').value, categoria:qs('#dCategoria').value.trim(), kind:qs('#dKind').value, valor:Number(qs('#dValor').value||0), obs:qs('#dObs').value.trim() };
  state.despesas.push(d); saveAll(); ev.target.reset(); qs('#dDate').valueAsDate=new Date(); renderAll();
}
function addMeta(ev){ ev.preventDefault(); state.metas.push({ id:uid(), nome:qs('#mNome').value.trim(), alvo:Number(qs('#mAlvo').value||0), ate:qs('#mAte').value, pago:0 }); saveAll(); ev.target.reset(); renderAll(); }

function setup(){
  loadAll();
  qs('#filterMonth').value=new Date().toISOString().slice(0,7);
  qs('#qDate').valueAsDate=new Date(); qs('#eDate').valueAsDate=new Date(); qs('#dDate').valueAsDate=new Date();
  applyConfigToUI();
  renderAll();

  qsa('.tabs button').forEach(b=>{ b.id='tab-btn-'+b.dataset.tab; b.addEventListener('click',()=>go(b.dataset.tab)); });
  _drawer=qs('#drawer'); _overlay=qs('#drawerOverlay'); _btn=qs('#btnMenu');
  _btn.addEventListener('click', ()=>{ _drawer.classList.add('show'); _overlay.classList.add('show'); _btn.setAttribute('aria-expanded','true'); _drawer.setAttribute('aria-hidden','false'); });
  _overlay.addEventListener('click', closeDrawer);
  qsa('.drawer nav a[data-go]').forEach(a=> a.addEventListener('click', (e)=>{ e.preventDefault(); go(a.dataset.go); }));

  let sx=null,sy=null,tracking=false;
  window.addEventListener('touchstart',(e)=>{ const t=e.touches[0]; if(t.clientX<24){ sx=t.clientX; sy=t.clientY; tracking=true; } },{passive:true});
  window.addEventListener('touchmove',(e)=>{ if(!tracking) return; const t=e.touches[0]; const dx=t.clientX-sx, dy=t.clientY-sy; if(Math.abs(dx)>40 && Math.abs(dx)>Math.abs(dy)){ _drawer.classList.add('show'); _overlay.classList.add('show'); tracking=false; } },{passive:true});
  window.addEventListener('touchend',()=> tracking=false,{passive:true});
  _drawer.addEventListener('touchstart',(e)=>{ const t=e.touches[0]; sx=t.clientX; sy=t.clientY; tracking=true; },{passive:true});
  _drawer.addEventListener('touchmove',(e)=>{ if(!tracking) return; const t=e.touches[0]; const dx=t.clientX-sx, dy=t.clientY-sy; if(dx<-40 && Math.abs(dx)>Math.abs(dy)){ closeDrawer(); tracking=false; } },{passive:true});

  qs('#filterMonth').addEventListener('change', renderAll);
  qs('#filterOwner').addEventListener('change', renderEntradas);
  qs('#btnPDF').addEventListener('click', openPDF);
  qs('#btnInstall').style.display='none';
  window.addEventListener('beforeinstallprompt',(e)=>{ e.preventDefault(); qs('#btnInstall').style.display='inline-block'; qs('#btnInstall').onclick=()=> e.prompt(); });
  if('serviceWorker' in navigator){ navigator.serviceWorker.register('./sw.js'); }

  qs('#btnQuick').addEventListener('click', ()=>{ document.getElementById('qCliente').focus(); go('resumo'); });
  qs('#formQuick').addEventListener('submit', addEntradaQuick);
  qs('#formEntrada').addEventListener('submit', addEntrada);
  qs('#formDespesa').addEventListener('submit', addDespesa);
  qs('#formMeta').addEventListener('submit', addMeta);

  qs('#btnExport').addEventListener('click', exportBackup);
  qs('#btnImport').addEventListener('click', importBackup);
  qs('#btnSnapshot').addEventListener('click', snapshotMes);
  qs('#btnSaveConfig').addEventListener('click', saveConfig);
  qs('#goPDF').addEventListener('click', (e)=>{e.preventDefault(); openPDF();});
  qs('#goReset').addEventListener('click', (e)=>{ e.preventDefault(); if(confirm('Apagar todos os dados locais?')){ Object.values(LS).forEach(k=>localStorage.removeItem(k)); loadAll(); renderAll(); }});
}
window.addEventListener('load', setup);
