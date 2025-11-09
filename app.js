/* FLOW v8.2 core */
const LS={ entradas:"flow:v8_2:entradas",despesas:"flow:v8_2:despesas",metas:"flow:v8_2:metas",parcelas:"flow:v8_2:parcelas",config:"flow:v8_2:config" };
const qs=(s,el=document)=>el.querySelector(s); const qsa=(s,el=document)=>[...el.querySelectorAll(s)];
const state={ entradas:[], despesas:[], metas:[], parcelas:[], config:{ dizimo:10, investMax:30 } };
function money(n){ return Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function uid(){ return Math.random().toString(36).slice(2,9); }
function seedParcelas(){ state.parcelas=[{id:uid(),nome:"Ailos (acordo — não conta corrente)",parcela:196.63,total:25,pagas:2},{id:uid(),nome:"Carro",parcela:767.32,total:48,pagas:22}]; localStorage.setItem(LS.parcelas,JSON.stringify(state.parcelas)); }
function renderParcelasDemo(){
  const c=document.createElement('div'); c.className='stack'; document.body.appendChild(c);
  (state.parcelas.length?state.parcelas:[]).forEach(p=>{ const total=p.parcela*p.total; const pago=p.parcela*(p.pagas||0); const left=(p.total-(p.pagas||0)); const pct=Math.round(((p.pagas||0)/p.total)*100);
    const el=document.createElement('div'); el.className='item'; el.innerHTML=`<div class='top'><strong>${p.nome}</strong><div class='actions'><button class='mini pay'>+1 paga</button></div></div><div class='meta'><span class='badge'>Parcela: ${money(p.parcela)}</span><span class='badge'>Total: ${p.total}x</span><span class='badge'>Pagas: ${p.pagas||0}x</span><span class='badge'>Restantes: ${left}x</span></div><div class='meta'><span>Total: <b>${money(total)}</b></span><span>Pago: <b>${money(pago)}</b></span></div><div class='progress'><div class='bar' style='width:${pct}%'></div></div>`; el.querySelector('.pay').onclick=()=>{ p.pagas=Math.min(p.total,(p.pagas||0)+1); localStorage.setItem(LS.parcelas,JSON.stringify(state.parcelas)); location.reload(); }; c.appendChild(el); });
}
window.addEventListener('load',()=>{ try{ state.parcelas=JSON.parse(localStorage.getItem(LS.parcelas)||"[]"); }catch{} if(state.parcelas.length===0) seedParcelas(); renderParcelasDemo(); });
