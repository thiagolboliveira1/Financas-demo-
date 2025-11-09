
const LS={ entradas:"flow:v8_3:entradas",despesas:"flow:v8_3:despesas",parcelas:"flow:v8_3:parcelas",metas:"flow:v8_3:metas",cfg:"flow:v8_3:cfg" };
const qs=(s,el=document)=>el.querySelector(s); const qsa=(s,el=document)=>[...el.querySelectorAll(s)];
const cfg=Object.assign({dizimo:10}, JSON.parse(localStorage.getItem(LS.cfg)||"{}"));
let entradas=JSON.parse(localStorage.getItem(LS.entradas)||"[]");
let despesas=JSON.parse(localStorage.getItem(LS.despesas)||"[]");
let parcelas=JSON.parse(localStorage.getItem(LS.parcelas)||"[]");
let metas=JSON.parse(localStorage.getItem(LS.metas)||"[]");

function save(){ localStorage.setItem(LS.entradas,JSON.stringify(entradas)); localStorage.setItem(LS.despesas,JSON.stringify(despesas)); localStorage.setItem(LS.parcelas,JSON.stringify(parcelas)); localStorage.setItem(LS.metas,JSON.stringify(metas)); localStorage.setItem(LS.cfg,JSON.stringify(cfg)); }
function uid(){ return Math.random().toString(36).slice(2,9); }
function money(n){ return Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function curMonth(){ return (qs('#filterMonth').value || new Date().toISOString().slice(0,7)); }
function monthFilter(arr, key){ const m=curMonth(); return arr.filter(x=>(x[key]||'').startsWith(m)); }

// seeds
if(parcelas.length===0){ parcelas=[{id:uid(),nome:"Ailos (acordo — não conta corrente)",parcela:196.63,total:25,pagas:2},{id:uid(),nome:"Carro",parcela:767.32,total:48,pagas:22}]; }
if(metas.length===0){ metas=[{id:uid(),nome:"Serasa — Claro",alvo:325.52,pago:0},{id:uid(),nome:"Serasa — Shopee",alvo:173.59,pago:0},{id:uid(),nome:"13º Thiago",alvo:5000,pago:0},{id:uid(),nome:"Viagem",alvo:2500,pago:0},{id:uid(),nome:"Reserva",alvo:3000,pago:0}]; }
save();

function totals(){
  const e=monthFilter(entradas,'date');
  const d=monthFilter(despesas,'date');
  const rate=cfg.dizimo/100;
  let bruto=0, diz=0, liq=0;
  e.forEach(x=>{ bruto+=x.entrada; const dz=x.entrada*rate; diz+=dz; liq+=(x.entrada-dz); });
  const dTot=d.reduce((s,x)=>s+x.valor,0);
  return {bruto,diz,liq,desp:dTot,saldo:liq-dTot};
}

function renderResumo(){
  const t=totals();
  qs('#kBruto').textContent=money(t.bruto);
  qs('#kDizimo').textContent=money(t.diz);
  qs('#kLiquido').textContent=money(t.liq);
  qs('#kDespesas').textContent=money(t.desp);
  qs('#kSaldo').textContent=money(t.saldo);
}

function renderEntradas(){
  const wrap=qs('#listaEntradas'); if(!wrap) return; wrap.innerHTML="";
  const rate=cfg.dizimo/100;
  monthFilter(entradas,'date').sort((a,b)=>a.date.localeCompare(b.date)).forEach(e=>{
    const dz=+(e.entrada*rate).toFixed(2); const lq=+(e.entrada-dz).toFixed(2);
    const rest=Math.max(0,+(e.total-e.entrada).toFixed(2)); const pct=e.total>0?Math.round((e.entrada/e.total)*100):0;
    const el=document.createElement('div'); el.className='item';
    el.innerHTML=`<div class='top'><strong>${e.owner} — ${e.cliente}</strong>
      <div><button class='mini del' style='padding:6px 10px;border-radius:10px;border:1px solid #e5b'>Excluir</button></div></div>
      <div class='meta'><span class='badge'>${e.date}</span><span class='badge'>${e.forma}</span></div>
      <div class='meta'><span>Total: <b>${money(e.total)}</b></span><span>Entrada: <b>${money(e.entrada)}</b></span><span>Resta: <b>${money(rest)}</b></span><span>Recebido: <b>${pct}%</b></span></div>
      <div class='meta'><span>Dízimo (${cfg.dizimo}%): <b>${money(dz)}</b></span><span>Líquido: <b>${money(lq)}</b></span></div>`;
    el.querySelector('.del').onclick=()=>{ entradas=entradas.filter(x=>x.id!==e.id); save(); renderAll(); };
    wrap.appendChild(el);
  });
}

function renderDespesas(){
  const wrap=qs('#listaDespesas'); if(!wrap) return; wrap.innerHTML="";
  monthFilter(despesas,'date').sort((a,b)=>a.date.localeCompare(b.date)).forEach(d=>{
    const el=document.createElement('div'); el.className='item';
    el.innerHTML=`<div class='top'><strong>${d.categoria}</strong><div><button class='mini del' style='padding:6px 10px;border:1px solid #e5b;border-radius:10px'>Excluir</button></div></div>
      <div class='meta'><span class='badge'>${d.date}</span><span class='badge'>${d.kind==='fixa'?'Fixa':'Variável'}</span></div>
      <div class='meta'><span><b>${money(d.valor)}</b></span><span>${d.obs||''}</span></div>`;
    el.querySelector('.del').onclick=()=>{ despesas=despesas.filter(x=>x.id!==d.id); save(); renderAll(); };
    wrap.appendChild(el);
  });
}

function renderParcelas(){
  const wrap=qs('#listaParcelas'); if(!wrap) return; wrap.innerHTML="";
  parcelas.forEach(p=>{
    const total=+(p.parcela*p.total).toFixed(2);
    const pago=+(p.parcela*(p.pagas||0)).toFixed(2);
    const rest=Math.max(0, +(total-pago).toFixed(2));
    const left=Math.max(0,(p.total-(p.pagas||0)));
    const pct=p.total>0?Math.round(((p.pagas||0)/p.total)*100):0;
    const el=document.createElement('div'); el.className='item';
    el.innerHTML=`<div class='top'><strong>${p.nome}</strong>
      <div>
        <button class='mini pay' style='padding:6px 10px;border-radius:10px;border:1px solid #9cf'>+1 paga</button>
      </div></div>
      <div class='meta'><span class='badge'>Parcela: ${money(p.parcela)}</span><span class='badge'>Total: ${p.total}x</span><span class='badge'>Pagas: ${p.pagas||0}x</span><span class='badge'>Restantes: ${left}x</span></div>
      <div class='meta'><span>Total: <b>${money(total)}</b></span><span>Pago: <b>${money(pago)}</b></span><span>Restante: <b>${money(rest)}</b></span></div>
      <div class='progress'><div class='bar' style='width:${pct}%'></div></div>`;
    el.querySelector('.pay').onclick=()=>{ p.pagas=Math.min(p.total,(p.pagas||0)+1); save(); renderAll(); };
    wrap.appendChild(el);
  });
}

function renderMetas(){
  const wrap=qs('#metas'); if(!wrap) return; wrap.innerHTML="";
  metas.forEach(m=>{
    const pct=m.alvo>0?Math.round(((m.pago||0)/m.alvo)*100):0;
    const el=document.createElement('div'); el.className='item';
    el.innerHTML=`<div class='top'><strong>${m.nome}</strong></div>
      <div class='meta'><span class='badge'>Alvo: ${money(m.alvo)}</span><span class='badge'>Acumulado: ${money(m.pago||0)}</span></div>
      <div class='progress'><div class='bar' style='width:${pct}%'></div></div>`;
    wrap.appendChild(el);
  });
}

function renderAll(){ renderResumo(); renderEntradas(); renderDespesas(); renderParcelas(); renderMetas(); }

// forms
document.addEventListener('submit', (ev)=>{
  const id=ev.target.id;
  if(id==='formQuick'){
    ev.preventDefault();
    const e={id:uid(), owner:qs('#qOwner').value, cliente:qs('#qCliente').value.trim(), forma:qs('#qForma').value.trim(), date:qs('#qDate').value, total:Number(qs('#qTotal').value||0), entrada:Number(qs('#qEntrada').value||0)};
    entradas.push(e); save(); ev.target.reset(); qs('#qDate').valueAsDate=new Date(); renderAll();
  }
  if(id==='formDesp'){
    ev.preventDefault();
    const d={id:uid(), date:qs('#dDate').value, categoria:qs('#dCategoria').value.trim(), kind:qs('#dKind').value, valor:Number(qs('#dValor').value||0), obs:qs('#dObs').value.trim()};
    despesas.push(d); save(); ev.target.reset(); qs('#dDate').valueAsDate=new Date(); renderAll();
  }
});

// menu & navegação
const drawer=qs('#drawer'), overlay=qs('#overlay'), btn=qs('#btnMenu');
btn.addEventListener('click', ()=>{ drawer.classList.add('show'); overlay.classList.add('show'); });
overlay.addEventListener('click', ()=>{ drawer.classList.remove('show'); overlay.classList.remove('show'); });
qsa('.tabs button').forEach(b=> b.addEventListener('click', ()=>{ qsa('.tabs button').forEach(x=>x.classList.remove('active')); b.classList.add('active'); document.getElementById('tab-'+b.dataset.tab).scrollIntoView({behavior:'smooth'}); }));
qsa('#drawer [data-go]').forEach(a=> a.addEventListener('click', (e)=>{ e.preventDefault(); const t=a.dataset.go; document.getElementById('tab-'+t).scrollIntoView({behavior:'smooth'}); drawer.classList.remove('show'); overlay.classList.remove('show'); }));

// PDF
qs('#btnPDF').addEventListener('click', ()=>{ document.title='FLOW — Relatório '+curMonth(); window.print(); });

// backup
qs('#btnExport').addEventListener('click', ()=>{
  const data={entradas,despesas,parcelas,metas,cfg};
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})); a.download='flow-backup.json'; a.click();
});
qs('#btnImport').addEventListener('click', ()=>{
  const f=qs('#fileImport').files[0]; if(!f) return alert('Selecione o JSON.');
  const r=new FileReader(); r.onload=()=>{ const o=JSON.parse(r.result||'{}'); entradas=o.entradas||[]; despesas=o.despesas||[]; parcelas=o.parcelas||[]; metas=o.metas||[]; Object.assign(cfg,o.cfg||{}); save(); renderAll(); alert('Importado'); }; r.readAsText(f);
});

// init
window.addEventListener('load', ()=>{
  qs('#filterMonth').value=new Date().toISOString().slice(0,7);
  ['qDate','dDate'].forEach(id=>{ const el=qs('#'+id); if(el) el.valueAsDate=new Date(); });
  renderAll();
});
