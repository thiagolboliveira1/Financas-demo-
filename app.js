/* NuBlue v3 — Cards only, 10% dízimo, metas e backup */
const LS = { entradas:"nublue:v3:entradas", despesas:"nublue:v3:despesas", metas:"nublue:v3:metas" };
const qs=(s,el=document)=>el.querySelector(s); const qsa=(s,el=document)=>[...el.querySelectorAll(s)];
const state={ entradas:[], despesas:[], metas:[] };
function money(n){ return Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function uid(){ return Math.random().toString(36).slice(2,9); }
function mstr(){ return qs('#filterMonth').value || new Date().toISOString().slice(0,7); }
function save(){ localStorage.setItem(LS.entradas, JSON.stringify(state.entradas)); localStorage.setItem(LS.despesas, JSON.stringify(state.despesas)); localStorage.setItem(LS.metas, JSON.stringify(state.metas)); }
function load(){
  try{ state.entradas = JSON.parse(localStorage.getItem(LS.entradas)||"[]"); }catch{}
  try{ state.despesas = JSON.parse(localStorage.getItem(LS.despesas)||"[]"); }catch{}
  try{ state.metas = JSON.parse(localStorage.getItem(LS.metas)||"[]"); }catch{}
  if(state.metas.length===0){ seedMetas(); }
}
function seedMetas(){
  const month = new Date().toISOString().slice(0,7);
  state.metas = [
    {id:uid(), nome:"Pagar Serasa", alvo:3000, ate:month, pago:0},
    {id:uid(), nome:"13º Thiago", alvo:5000, ate:month, pago:0},
    {id:uid(), nome:"Viagem fim de ano", alvo:2500, ate:month, pago:0},
    {id:uid(), nome:"Reserva emergencial", alvo:10000, ate:month, pago:0},
  ];
  save();
}
function monthFilter(list, key){ const m=mstr(); return list.filter(x => (x[key]||"").startsWith(m)); }
function totalsEntradas(){ const arr=monthFilter(state.entradas,'date'); const bruto=arr.reduce((s,x)=>s+x.bruto,0); const diz=arr.reduce((s,x)=>s+x.dizimo,0); const liq=arr.reduce((s,x)=>s+x.liquido,0); return {bruto,diz,liq}; }
function totalsDespesas(){ const arr=monthFilter(state.despesas,'date'); const total=arr.reduce((s,x)=>s+x.valor,0); const fixas=arr.filter(x=>x.kind==='fixa').reduce((s,x)=>s+x.valor,0); const variaveis=total-fixas; return {total,fixas,variaveis}; }
function saldoMes(){ const e=totalsEntradas(), d=totalsDespesas(); return {...e, ...d, saldo: e.liq - d.total}; }

/* ENTRADAS */
function renderEntradas(){
  const wrap=qs('#listaEntradas'); wrap.innerHTML='';
  const arr=monthFilter(state.entradas,'date').sort((a,b)=> a.date.localeCompare(b.date));
  arr.forEach(e=>{
    const el=document.createElement('div'); el.className='item';
    el.innerHTML=`<div class="top"><strong>${e.desc}</strong><div class="actions"><button class="mini">Editar</button><button class="mini danger">Excluir</button></div></div>
                  <div class="meta"><span class="badge">${e.date}</span><span class="badge">${e.wallet||'Carteira'}</span></div>
                  <div class="meta"><span>Bruto: <b>${money(e.bruto)}</b></span><span>Dízimo: <b>${money(e.dizimo)}</b></span><span>Líquido: <b class="amt">${money(e.liquido)}</b></span></div>`;
    el.querySelector('.danger').addEventListener('click',()=>{ if(confirm('Excluir entrada?')){ state.entradas=state.entradas.filter(x=>x.id!==e.id); save(); renderAll(); } });
    el.querySelector('.mini:not(.danger)').addEventListener('click',()=>{
      el.innerHTML=`<form class="col">
          <input type="date" value="${e.date}" required>
          <input value="${e.desc}" required>
          <input value="${e.wallet||''}" placeholder="Carteira">
          <input type="number" step="0.01" value="${e.bruto}" required>
          <div class="actions"><button class="mini primary">Salvar</button><button class="mini">Cancelar</button></div>
        </form>`;
      const [date,desc,wal,bruto]=el.querySelectorAll('input');
      el.querySelector('.primary').addEventListener('click',(ev)=>{
        ev.preventDefault(); e.date=date.value; e.desc=desc.value; e.wallet=wal.value; e.bruto=Number(bruto.value||0); e.dizimo=+(e.bruto*0.10).toFixed(2); e.liquido=+(e.bruto-e.dizimo).toFixed(2); save(); renderAll();
      });
      el.querySelector('.mini:not(.primary)').addEventListener('click',(ev)=>{ ev.preventDefault(); renderAll(); });
    });
    wrap.appendChild(el);
  });
  const t=totalsEntradas(); qs('#entBruto').textContent=money(t.bruto); qs('#entDizimo').textContent=money(t.diz); qs('#entLiquido').textContent=money(t.liq);
}

/* DESPESAS */
function renderDespesas(){
  const wrap=qs('#listaDespesas'); wrap.innerHTML='';
  const arr=monthFilter(state.despesas,'date').sort((a,b)=> a.date.localeCompare(b.date));
  arr.forEach(d=>{
    const el=document.createElement('div'); el.className='item';
    el.innerHTML=`<div class="top"><strong>${d.cat}</strong><div class="actions"><button class="mini">Editar</button><button class="mini danger">Excluir</button></div></div>
                  <div class="meta"><span class="badge">${d.date}</span><span class="badge">${d.wallet||'Carteira'}</span><span class="badge">${d.kind==='fixa'?'Fixa':'Variável'}</span></div>
                  <div class="meta"><span class="amt">${money(d.valor)}</span> <span>${d.obs||''}</span></div>`;
    el.querySelector('.danger').addEventListener('click',()=>{ if(confirm('Excluir despesa?')){ state.despesas=state.despesas.filter(x=>x.id!==d.id); save(); renderAll(); } });
    el.querySelector('.mini:not(.danger)').addEventListener('click',()=>{
      el.innerHTML=`<form class="col">
          <input type="date" value="${d.date}" required>
          <input value="${d.cat}" required>
          <input value="${d.wallet||''}" placeholder="Carteira">
          <select><option value="fixa" ${d.kind==='fixa'?'selected':''}>Fixa</option><option value="variavel" ${d.kind==='variavel'?'selected':''}>Variável</option></select>
          <input type="number" step="0.01" value="${d.valor}" required>
          <input value="${d.obs||''}" placeholder="Observação">
          <div class="actions"><button class="mini primary">Salvar</button><button class="mini">Cancelar</button></div>
        </form>`;
      const [date,cat,wal,kind,valor,obs]=el.querySelectorAll('input,select');
      el.querySelector('.primary').addEventListener('click',(ev)=>{ ev.preventDefault(); d.date=date.value; d.cat=cat.value; d.wallet=wal.value; d.kind=kind.value; d.valor=Number(valor.value||0); d.obs=obs.value; save(); renderAll(); });
      el.querySelector('.mini:not(.primary)').addEventListener('click',(ev)=>{ ev.preventDefault(); renderAll(); });
    });
    wrap.appendChild(el);
  });
  const t=totalsDespesas(); qs('#despTotal').textContent=money(t.total); qs('#despFixas').textContent=money(t.fixas); qs('#despVar').textContent=money(t.variaveis);
}

/* RESUMO + INVESTIMENTO */
function renderResumo(){
  const s=saldoMes();
  qs('#kBruto').textContent=money(s.bruto); qs('#kDizimo').textContent=money(s.diz); qs('#kLiquido').textContent=money(s.liq);
  qs('#kDespesas').textContent=money(s.total); qs('#kSaldo').textContent=money(s.saldo);
  const disponivel=Math.max(0, s.liq - s.total);
  const pct = s.liq>0 ? Math.min(30, Math.floor((disponivel/s.liq)*100)) : 0;
  qs('#pctSug').textContent=pct+'%'; const range=qs('#pctRange'); range.value=pct;
  qs('#valInvest').textContent=money((range.value/100)*s.liq);
  range.oninput=()=>{ qs('#valInvest').textContent=money((range.value/100)*s.liq); renderDistrib(range.value/100); };
  renderDistrib(range.value/100);
}

/* METAS */
function renderMetas(){
  const wrap=qs('#metas'); wrap.innerHTML='';
  state.metas.forEach(m=>{
    const pago=m.pago||0; const pct=m.alvo>0? Math.min(100, Math.round((pago/m.alvo)*100)) : 0;
    const el=document.createElement('div'); el.className='item';
    el.innerHTML=`<div class="top"><strong>${m.nome}</strong><div class="actions"><button class="mini">Editar</button><button class="mini danger">Excluir</button></div></div>
                  <div class="meta"><span class="badge">Alvo: ${money(m.alvo)}</span><span class="badge">Prazo: ${m.ate||'-'}</span><span class="badge">Acumulado: ${money(pago)}</span></div>
                  <div class="progress"><div class="bar" style="width:${pct}%"></div></div>`;
    el.querySelector('.danger').addEventListener('click',()=>{ if(confirm('Excluir meta?')){ state.metas=state.metas.filter(x=>x.id!==m.id); save(); renderAll(); } });
    el.querySelector('.mini:not(.danger)').addEventListener('click',()=>{
      el.innerHTML=`<form class="grid2">
        <input value="${m.nome}" required>
        <input type="number" step="0.01" value="${m.alvo}" required>
        <input type="month" value="${m.ate||''}">
        <input type="number" step="0.01" value="${pago}" placeholder="Acumulado">
        <div class="actions"><button class="mini primary">Salvar</button><button class="mini">Cancelar</button></div>
      </form>`;
      const [nome,alvo,ate,pagado]=el.querySelectorAll('input');
      el.querySelector('.primary').addEventListener('click',(ev)=>{ ev.preventDefault(); m.nome=nome.value; m.alvo=Number(alvo.value||0); m.ate=ate.value; m.pago=Number(pagado.value||0); save(); renderAll(); });
      el.querySelector('.mini:not(.primary)').addEventListener('click',(ev)=>{ ev.preventDefault(); renderAll(); });
    });
    wrap.appendChild(el);
  });
}
function renderDistrib(fator){
  const s=saldoMes(); const invest=fator*s.liq;
  const distWrap=qs('#dist'); distWrap.innerHTML='';
  const order=['serasa','reserva','13','viagem'];
  const metas=[...state.metas].sort((a,b)=>{
    const ia=order.findIndex(k=>a.nome.toLowerCase().includes(k)); const ib=order.findIndex(k=>b.nome.toLowerCase().includes(k));
    return (ia<0?99:ia)-(ib<0?99:ib);
  });
  const needs=metas.map(m=> Math.max(0,(m.alvo||0)-(m.pago||0))); const totalNeed=needs.reduce((s,x)=>s+x,0)||1;
  metas.forEach((m,i)=>{
    const share = invest * (needs[i]/totalNeed) * (1 + (i===0?0.15: i===1?0.05:0));
    const el=document.createElement('div'); el.className='item'; el.innerHTML=`<div class="top"><strong>${m.nome}</strong><strong>${money(share)}</strong></div>`;
    distWrap.appendChild(el);
  });
}

/* BACKUP */
function exportBackup(){
  const data = { entradas: state.entradas, despesas: state.despesas, metas: state.metas };
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='financeiro-backup.json'; a.click();
}
function importBackup(){
  const f=qs('#fileImport').files[0]; if(!f) return alert('Selecione um arquivo JSON.');
  const r=new FileReader(); r.onload=()=>{ try{ const o=JSON.parse(r.result); state.entradas=o.entradas||[]; state.despesas=o.despesas||[]; state.metas=o.metas||[]; save(); renderAll(); alert('Backup importado!'); }catch{ alert('Arquivo inválido.'); } }; r.readAsText(f);
}

/* RENDER ALL */
function renderAll(){ renderEntradas(); renderDespesas(); renderResumo(); renderMetas(); }

/* HANDLERS */
function addEntrada(ev){
  ev.preventDefault();
  const e={ id:uid(), date:qs('#eDate').value, desc:qs('#eDesc').value.trim(), wallet:qs('#eWallet').value.trim(), bruto:Number(qs('#eValor').value||0) };
  e.dizimo=+(e.bruto*0.10).toFixed(2); e.liquido=+(e.bruto-e.dizimo).toFixed(2);
  state.entradas.push(e); save(); ev.target.reset(); qs('#eDate').valueAsDate=new Date(); renderAll();
}
function addDespesa(ev){
  ev.preventDefault();
  const d={ id:uid(), date:qs('#dDate').value, cat:qs('#dCategoria').value.trim(), wallet:qs('#dWallet').value.trim(), kind:qs('#dKind').value, valor:Number(qs('#dValor').value||0), obs:qs('#dObs').value.trim() };
  state.despesas.push(d); save(); ev.target.reset(); qs('#dDate').valueAsDate=new Date(); renderAll();
}
function openPDF(){ document.title='Relatório Financeiro — '+mstr(); window.print(); }

/* Drawer + swipe */
(function(){
  const drawer=qs('#drawer'), overlay=qs('#drawerOverlay'), btn=qs('#btnMenu');
  function open(){ drawer.classList.add('show'); overlay.classList.add('show'); }
  function close(){ drawer.classList.remove('show'); overlay.classList.remove('show'); }
  btn?.addEventListener('click', open); overlay?.addEventListener('click', close);
  let sx=null,sy=null,tracking=false;
  window.addEventListener('touchstart',(e)=>{ const t=e.touches[0]; if(t.clientX<24){ sx=t.clientX; sy=t.clientY; tracking=true; } },{passive:true});
  window.addEventListener('touchmove',(e)=>{ if(!tracking)return; const t=e.touches[0]; const dx=t.clientX-sx, dy=t.clientY-sy; if(Math.abs(dx)>40 && Math.abs(dx)>Math.abs(dy)){ open(); tracking=false; } },{passive:true});
  window.addEventListener('touchend',()=> tracking=false,{passive:true});
  drawer.addEventListener('touchstart',(e)=>{ const t=e.touches[0]; sx=t.clientX; sy=t.clientY; tracking=true; },{passive:true});
  drawer.addEventListener('touchmove',(e)=>{ if(!tracking)return; const t=e.touches[0]; const dx=t.clientX-sx, dy=t.clientY-sy; if(dx<-40 && Math.abs(dx)>Math.abs(dy)){ close(); tracking=false; } },{passive:true});
  qsa('.drawer nav a[data-go]').forEach(a=> a.addEventListener('click',(ev)=>{ ev.preventDefault(); const tab=a.dataset.go; qsa('.tabs button').forEach(b=>b.classList.remove('active')); qs(`.tabs button[data-tab="${tab}"]`)?.classList.add('active'); qsa('.tab').forEach(s=>s.classList.remove('active')); qs('#tab-'+tab).classList.add('active'); close(); }));
  qs('#goPDF')?.addEventListener('click',(e)=>{ e.preventDefault(); close(); openPDF(); });
  qs('#goReset')?.addEventListener('click',(e)=>{ e.preventDefault(); if(confirm('Apagar todos os dados locais?')){ localStorage.removeItem(LS.entradas); localStorage.removeItem(LS.despesas); localStorage.removeItem(LS.metas); load(); renderAll(); close(); }});
})();

function setup(){
  load();
  qs('#filterMonth').value=new Date().toISOString().slice(0,7);
  qs('#eDate').valueAsDate=new Date(); qs('#dDate').valueAsDate=new Date();
  renderAll();
  qsa('.tabs button').forEach(b=> b.addEventListener('click',()=>{ qsa('.tabs button').forEach(x=>x.classList.remove('active')); b.classList.add('active'); qsa('.tab').forEach(s=>s.classList.remove('active')); qs('#tab-'+b.dataset.tab).classList.add('active'); }));
  ['filterMonth'].forEach(id=> qs('#'+id)?.addEventListener('change', renderAll));
  qs('#formEntrada').addEventListener('submit', addEntrada);
  qs('#formDespesa').addEventListener('submit', addDespesa);
  qs('#formMeta').addEventListener('submit',(ev)=>{ ev.preventDefault(); state.metas.push({id:uid(), nome:qs('#mNome').value.trim(), alvo:Number(qs('#mAlvo').value||0), ate:qs('#mAte').value, pago:0}); save(); ev.target.reset(); renderAll(); });
  qs('#btnPDF').addEventListener('click', openPDF);
  qs('#btnExport').addEventListener('click', exportBackup);
  qs('#btnImport').addEventListener('click', importBackup);
  window.addEventListener('beforeinstallprompt',(e)=>{ e.preventDefault(); qs('#btnInstall').style.display='inline-block'; qs('#btnInstall').onclick=()=> e.prompt(); });
  if('serviceWorker' in navigator){ navigator.serviceWorker.register('./sw.js'); }
}
window.addEventListener('load', setup);
