
const LS={ entradas:"flow:v8_4_1:entradas",despesas:"flow:v8_4_1:despesas",parcelas:"flow:v8_4_1:parcelas",metas:"flow:v8_4_1:metas",cfg:"flow:v8_4_1:cfg" };
const qs=(s,el=document)=>el.querySelector(s); const qsa=(s,el=document)=>[...el.querySelectorAll(s)];
const cfg=Object.assign({dizimo:10, autoApply:false, alloc:{}}, JSON.parse(localStorage.getItem(LS.cfg)||"{}"));
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

function totals(){ const e=monthFilter(entradas,'date'), d=monthFilter(despesas,'date'); const rate=cfg.dizimo/100; let bruto=0,diz=0,liq=0; e.forEach(x=>{ bruto+=x.entrada; const dz=x.entrada*rate; diz+=dz; liq+=(x.entrada-dz); }); const dTot=d.reduce((s,x)=>s+x.valor,0); return {bruto,diz,liq,desp:dTot,saldo:liq-dTot}; }

function renderResumo(){ const t=totals(); qs('#kBruto').textContent=money(t.bruto); qs('#kDizimo').textContent=money(t.diz); qs('#kLiquido').textContent=money(t.liq); qs('#kDespesas').textContent=money(t.desp); qs('#kSaldo').textContent=money(t.saldo); }

function renderEntradas(){ const wrap=qs('#listaEntradas'); if(!wrap) return; wrap.innerHTML="";
  const rate=cfg.dizimo/100;
  monthFilter(entradas,'date').sort((a,b)=>a.date.localeCompare(b.date)).forEach(e=>{
    const dz=+(e.entrada*rate).toFixed(2), lq=+(e.entrada-dz).toFixed(2), rest=Math.max(0,+(e.total-e.entrada).toFixed(2)), pct=e.total>0?Math.round((e.entrada/e.total)*100):0;
    const el=document.createElement('div'); el.className='item';
    el.innerHTML=`<div class='top'><strong>${e.owner} — ${e.cliente}</strong><div><button class='mini del' style='padding:6px 10px;border-radius:10px;border:1px solid #e5b'>Excluir</button></div></div>
      <div class='meta'><span class='badge'>${e.date}</span><span class='badge'>${e.forma}</span></div>
      <div class='meta'><span>Total: <b>${money(e.total)}</b></span><span>Entrada: <b>${money(e.entrada)}</b></span><span>Resta: <b>${money(rest)}</b></span><span>Recebido: <b>${pct}%</b></span></div>
      <div class='meta'><span>Dízimo (${cfg.dizimo}%): <b>${money(dz)}</b></span><span>Líquido: <b>${money(lq)}</b></span></div>`;
    el.querySelector('.del').onclick=()=>{ entradas=entradas.filter(x=>x.id!==e.id); save(); renderAll(); };
    wrap.appendChild(el);
  });
}

function renderDespesas(){ const wrap=qs('#listaDespesas'); if(!wrap) return; wrap.innerHTML="";
  monthFilter(despesas,'date').sort((a,b)=>a.date.localeCompare(b.date)).forEach(d=>{
    const el=document.createElement('div'); el.className='item';
    el.innerHTML=`<div class='top'><strong>${d.categoria}</strong><div><button class='mini del' style='padding:6px 10px;border:1px solid #e5b;border-radius:10px'>Excluir</button></div></div>
      <div class='meta'><span class='badge'>${d.date}</span><span class='badge'>${d.kind==='fixa'?'Fixa':'Variável'}</span></div>
      <div class='meta'><span><b>${money(d.valor)}</b></span><span>${d.obs||''}</span></div>`;
    el.querySelector('.del').onclick=()=>{ despesas=despesas.filter(x=>x.id!==d.id); save(); renderAll(); };
    wrap.appendChild(el);
  });
}

function renderParcelas(){ const wrap=qs('#listaParcelas'); if(!wrap) return; wrap.innerHTML="";
  parcelas.forEach(p=>{
    const total=+(p.parcela*p.total).toFixed(2), pago=+(p.parcela*(p.pagas||0)).toFixed(2), rest=Math.max(0, +(total-pago).toFixed(2)), left=Math.max(0,(p.total-(p.pagas||0))), pct=p.total>0?Math.round(((p.pagas||0)/p.total)*100):0;
    const el=document.createElement('div'); el.className='item';
    el.innerHTML=`<div class='top'><strong>${p.nome}</strong><div><button class='mini pay' style='padding:8px 12px;border-radius:10px;border:1px solid #9cf'>+1 paga</button></div></div>
      <div class='meta'><span class='badge'>Parcela: ${money(p.parcela)}</span><span class='badge'>Total: ${p.total}x</span><span class='badge'>Pagas: ${p.pagas||0}x</span><span class='badge'>Restantes: ${left}x</span></div>
      <div class='meta'><span>Total: <b>${money(total)}</b></span><span>Pago: <b>${money(pago)}</b></span><span>Restante: <b>${money(rest)}</b></span></div>
      <div class='progress'><div class='bar' style='width:${pct}%'></div></div>`;
    el.querySelector('.pay').onclick=()=>{ p.pagas=Math.min(p.total,(p.pagas||0)+1); save(); renderAll(); };
    wrap.appendChild(el);
  });
}

function renderMetas(){ const wrap=qs('#metas'); if(!wrap) return; wrap.innerHTML="";
  metas.forEach(m=>{
    const pct=m.alvo>0?Math.round(((m.pago||0)/m.alvo)*100):0; const id=m.id;
    const el=document.createElement('div'); el.className='item';
    el.innerHTML=`<div class='top'><strong>${m.nome}</strong><span class='badge'>Progresso: ${pct}%</span></div>
      <div class='meta'><span class='badge'>Alvo: ${money(m.alvo)}</span><span class='badge'>Acumulado: ${money(m.pago||0)}</span></div>
      <div class='progress'><div class='bar' style='width:${pct}%'></div></div>
      <div class='top'><label>Adicionar valor (R$): <input type='number' step='0.01' inputmode='decimal' id='dep_{id}' style='width:140px'></label>
      <button class='primary' id='btn_{id}'>Depositar</button></div>`;
    el.querySelector('#btn_{id}'.replace('{id}',id)).onclick=()=>{
      const val=Number(qs('#dep_{id}'.replace('{id}',id)).value||0);
      if(val>0){ m.pago=(m.pago||0)+val; save(); renderAll(); }
    };
    wrap.appendChild(el);
  });
  // Alocações
  const al=qs('#alocacoes'); al.innerHTML='';
  metas.forEach(m=>{
    const val=(cfg.alloc[m.id]??0);
    const row=document.createElement('div'); row.className='top';
    row.innerHTML=`<div>${m.nome}</div><label><input type='number' min='0' max='100' step='1' value='${val}' id='alloc_${m.id}'> %</label>`;
    al.appendChild(row);
  });
  qs('#autoApply').checked=!!cfg.autoApply;
  renderDistribuicao();
}

function renderDistribuicao(){
  const dist=qs('#distSug'); if(!dist) return; dist.innerHTML='';
  const s=totals(); const pctMes=Math.max(0, Math.min(60, Number(qs('#pctMes').value||0)));
  const investir=(pctMes/100)*Math.max(0, s.liq - s.desp);
  qs('#saldoDisp').textContent='Saldo disp.: '+money(Math.max(0, s.liq - s.desp));
  if(investir<=0){ dist.innerHTML='<div class="meta">Sem saldo disponível para investir neste mês.</div>'; return; }
  // pesos
  const sumAlloc=Object.values(cfg.alloc).reduce((a,b)=>a+Number(b||0),0)||0; let weights={};
  if(sumAlloc>0){ metas.forEach(m=>weights[m.id]=(cfg.alloc[m.id]||0)/sumAlloc); }
  else { metas.forEach(m=>{ const n=m.nome.toLowerCase(); weights[m.id]= n.includes('serasa')?0.4: n.includes('reserva')?0.25: n.includes('13')?0.2:0.15; }); }
  const totalW=Object.values(weights).reduce((a,b)=>a+b,0)||1;
  metas.forEach(m=>{
    const need=Math.max(0,(m.alvo||0)-(m.pago||0));
    const share=investir*(weights[m.id]/totalW);
    const aplicar=Math.min(need||share, share);
    const row=document.createElement('div'); row.className='top'; row.innerHTML=`<div>${m.nome}</div><strong>${money(aplicar)}</strong>`;
    row.dataset.metaId=m.id; row.dataset.valor=aplicar; dist.appendChild(row);
  });
}

function aplicarDistribuicao(){
  qsa('#distSug .top').forEach(row=>{
    const id=row.dataset.metaId; const val=Number(row.dataset.valor||0);
    const m=metas.find(x=>x.id===id); if(!m) return;
    m.pago=(m.pago||0)+val;
  });
  save(); renderAll();
}

function renderAll(){ renderResumo(); renderEntradas(); renderDespesas(); renderParcelas(); renderMetas(); }

// forms (entrada, despesa, meta, parcela)
document.addEventListener('submit', (ev)=>{
  const id=ev.target.id;
  if(id==='formQuick'){
    ev.preventDefault();
    const e={id:uid(), owner:qs('#qOwner').value, cliente:qs('#qCliente').value.trim(), forma:qs('#qForma').value.trim(), date:qs('#qDate').value, total:Number(qs('#qTotal').value||0), entrada:Number(qs('#qEntrada').value||0)};
    // auto apply (30% do líquido usando pesos)
    const rate=cfg.dizimo/100; const liquido=e.entrada - (e.entrada*rate);
    if(cfg.autoApply){
      const sum=Object.values(cfg.alloc).reduce((a,b)=>a+Number(b||0),0)||1;
      metas.forEach(m=>{
        const peso=(cfg.alloc[m.id]||0)/sum;
        const val=liquido*peso*0.3;
        m.pago=(m.pago||0)+val;
      });
    }
    entradas.push(e); save(); ev.target.reset(); qs('#qDate').valueAsDate=new Date(); renderAll();
  }
  if(id==='formDesp'){
    ev.preventDefault();
    const d={id:uid(), date:qs('#dDate').value, categoria:qs('#dCategoria').value.trim(), kind:qs('#dKind').value, valor:Number(qs('#dValor').value||0), obs:qs('#dObs').value.trim()};
    despesas.push(d); save(); ev.target.reset(); qs('#dDate').valueAsDate=new Date(); renderAll();
  }
  if(id==='formMeta'){
    ev.preventDefault();
    const m={id:uid(), nome:qs('#mNome').value.trim(), alvo:Number(qs('#mAlvo').value||0), prazo:qs('#mPrazo').value, pago:0};
    metas.push(m); save(); ev.target.reset(); renderAll();
  }
  if(id==='formParc'){
    ev.preventDefault();
    const p={id:uid(), nome:qs('#pNome').value.trim(), parcela:Number(qs('#pParcela').value||0), total:parseInt(qs('#pTotal').value||'1'), pagas:parseInt(qs('#pPagas').value||'0')||0};
    parcelas.push(p); save(); ev.target.reset(); renderAll();
  }
});

// menu e PDF
let _drawer,_overlay,_btn;
function go(tab){ const sec=document.getElementById('tab-'+tab); if(sec){ sec.scrollIntoView({behavior:'smooth',block:'start'}); } closeDrawer(); }
function closeDrawer(){ _drawer.classList.remove('show'); _overlay.classList.remove('show'); _btn.setAttribute('aria-expanded','false'); _drawer.setAttribute('aria-hidden','true'); }

function setup(){
  qs('#filterMonth').value=new Date().toISOString().slice(0,7);
  ['qDate','dDate'].forEach(id=>{ const el=qs('#'+id); if(el) el.valueAsDate=new Date(); });
  renderAll();
  _drawer=qs('#drawer'); _overlay=qs('#drawerOverlay'); _btn=qs('#btnMenu');
  _btn.addEventListener('click', ()=>{ _drawer.classList.add('show'); _overlay.classList.add('show'); });
  _overlay.addEventListener('click', closeDrawer);
  qsa('.drawer nav [data-go]').forEach(a=> a.addEventListener('click',(e)=>{ e.preventDefault(); go(a.dataset.go); }));
  qs('#btnPDF').addEventListener('click', ()=>{ document.title='FLOW — Relatório '+curMonth(); window.print(); });
  qs('#goPDF')?.addEventListener('click', (e)=>{ e.preventDefault(); document.title='FLOW — Relatório '+curMonth(); window.print(); });
  // metas: salvar alocação e aplicar distribuição
  qs('#saveAlloc').addEventListener('click', ()=>{
    metas.forEach(m=> cfg.alloc[m.id]=Number(qs('#alloc_'+m.id).value||0));
    cfg.autoApply = qs('#autoApply').checked;
    save(); renderDistribuicao(); alert('Alocação salva.');
  });
  qs('#pctMes').addEventListener('input', renderDistribuicao);
  qs('#btnAplicarDist').addEventListener('click', aplicarDistribuicao);
}
window.addEventListener('load', setup);
