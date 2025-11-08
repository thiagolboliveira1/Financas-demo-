/* NuBlue standalone app (no Sheets) */
const LS = {
  entries: "nublue:entries",
  budgets: "nublue:budgets"
};
const qs = (s, el=document)=> el.querySelector(s);
const qsa = (s, el=document)=> [...el.querySelectorAll(s)];
const state = {
  entries: [],
  budgets: {},
  categories: new Set([]),
  wallets: new Set([])
};

function uid(){ return Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-4); }
function fmt(v){ return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) }
function mstr(){ return qs('#filterMonth').value || new Date().toISOString().slice(0,7) }

function load(){
  try{ state.entries = JSON.parse(localStorage.getItem(LS.entries)||"[]"); }catch{ state.entries=[]; }
  try{ state.budgets = JSON.parse(localStorage.getItem(LS.budgets)||"{}"); }catch{ state.budgets={}; }
  if(state.entries.length===0){ seedData(); }
  rebuildSets();
}
function persist(){
  localStorage.setItem(LS.entries, JSON.stringify(state.entries));
  localStorage.setItem(LS.budgets, JSON.stringify(state.budgets));
}
function rebuildSets(){
  state.categories = new Set(state.entries.map(e=>e.category));
  state.wallets = new Set(state.entries.map(e=>e.wallet));
}

function seedData(){
  const month = new Date().toISOString().slice(0,7);
  const base = [
    {type:'income', date:`${month}-01`, category:'Salário', wallet:'Ailos', amount:5000, note:'Receita mensal', kind:'variavel'},
    {type:'expense', date:`${month}-05`, category:'Aluguel', wallet:'Nubank', amount:1600, note:'Casa', kind:'fixa'},
    {type:'expense', date:`${month}-05`, category:'Carro', wallet:'Nubank', amount:767, note:'Parcela/Manutenção', kind:'fixa'},
    {type:'expense', date:`${month}-10`, category:'Luz', wallet:'Nubank', amount:289, note:'Energia', kind:'fixa'},
    {type:'expense', date:`${month}-10`, category:'Água', wallet:'Nubank', amount:190, note:'Sanepar', kind:'fixa'},
    {type:'expense', date:`${month}-07`, category:'TIM', wallet:'Nubank', amount:45, note:'Plano TIM', kind:'fixa'},
    {type:'expense', date:`${month}-08`, category:'Ailos', wallet:'Ailos', amount:199, note:'Boleto Ailos', kind:'fixa'},
    {type:'expense', date:`${month}-12`, category:'Consórcio Moto', wallet:'Ailos', amount:467, note:'Parcela', kind:'fixa'},
    {type:'expense', date:`${month}-12`, category:'Mercado', wallet:'Nubank', amount:800, note:'Compras', kind:'variavel'},
    {type:'expense', date:`${month}-28`, category:'Cartão Nubank', wallet:'Nubank', amount:500, note:'Fatura', kind:'variavel'},
    {type:'expense', date:`${month}-18`, category:'Outros', wallet:'Dinheiro', amount:650, note:'Diversos', kind:'variavel'}
  ];
  state.entries = base.map(e=> ({id:uid(), createdAt:Date.now(), ...e}));
  state.budgets = {'Mercado':800,'Cartão Nubank':500,'Outros':650,'Luz':300,'Água':200,'Carro':800,'Aluguel':1600,'TIM':50,'Consórcio Moto':467};
}

function filtered(){
  const m=mstr(), w=qs('#filterWallet').value, c=qs('#filterCategory').value, k=qs('#filterKind').value;
  return state.entries
    .filter(e=> e.date?.startsWith(m))
    .filter(e=> !w || e.wallet===w)
    .filter(e=> !c || e.category===c)
    .filter(e=> !k || e.kind===k)
    .sort((a,b)=> a.date===b.date ? b.createdAt - a.createdAt : a.date.localeCompare(b.date));
}
function sums(arr){ let inc=0,exp=0; arr.forEach(e=> e.type==='income' ? inc+=e.amount : exp+=e.amount); return {inc,exp,bal:inc-exp}; }

function renderOptions(){
  const wallets = new Set(state.entries.map(e=>e.wallet));
  const categories = new Set(state.entries.map(e=>e.category));
  qs('#filterWallet').innerHTML = '<option value=\"\">Todas as carteiras</option>' + [...wallets].sort().map(w=>`<option>${w}</option>`).join('');
  qs('#filterCategory').innerHTML = '<option value=\"\">Todas as categorias</option>' + [...categories].sort().map(c=>`<option>${c}</option>`).join('');
  qs('#dlCat').innerHTML = [...categories].sort().map(c=>`<option value="${c}">`).join('');
  qs('#dlWal').innerHTML = [...wallets].sort().map(w=>`<option value="${w}">`).join('');
}

function renderKPIs(){
  const arr = filtered(); const {inc,exp,bal}=sums(arr);
  qs('#kpiIncome').textContent = fmt(inc);
  qs('#kpiExpense').textContent = fmt(exp);
  qs('#kpiBalance').textContent = fmt(bal);
  qs('#tIncome').textContent = fmt(inc);
  qs('#tExpense').textContent = fmt(exp);
  qs('#tBalance').textContent = fmt(bal);
}

function renderTable(){
  const tb = qs('#tbody'); tb.innerHTML='';
  filtered().forEach(e=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${e.date}</td><td>${e.category}</td><td>${e.wallet}</td>
      <td>${e.type==='income'?'Receita':'Despesa'}</td>
      <td class="num">${fmt(e.amount)}</td>
      <td>${e.note||''}</td>
      <td>${e.kind==='fixa'?'Fixa':'Variável'}</td>
      <td class="center"><button class="mini">Editar</button> <button class="mini danger">Excluir</button></td>`;
    // actions
    tr.querySelector('.danger').addEventListener('click', ()=>{
      if(confirm('Excluir lançamento?')){
        state.entries = state.entries.filter(x=> x.id!==e.id);
        persist(); rebuildSets(); rerender();
      }
    });
    tr.querySelector('.mini:not(.danger)').addEventListener('click', ()=> startEditRow(e, tr));
    tb.appendChild(tr);
  });
}

function startEditRow(e, tr){
  tr.innerHTML = `
    <td><input type="date" value="${e.date}"></td>
    <td><input list="dlCat" value="${e.category}"></td>
    <td><input list="dlWal" value="${e.wallet}"></td>
    <td>
      <select>
        <option value="income" ${e.type==='income'?'selected':''}>Receita</option>
        <option value="expense" ${e.type==='expense'?'selected':''}>Despesa</option>
      </select>
    </td>
    <td class="num"><input type="number" step="0.01" value="${e.amount}"></td>
    <td><input value="${e.note||''}"></td>
    <td>
      <select>
        <option value="variavel" ${e.kind==='variavel'?'selected':''}>Variável</option>
        <option value="fixa" ${e.kind==='fixa'?'selected':''}>Fixa</option>
      </select>
    </td>
    <td class="center"><button class="mini primary">Salvar</button> <button class="mini">Cancelar</button></td>`;
  const [date,cat,wallet,type,amount,note,kind] = tr.querySelectorAll('input,select');
  tr.querySelector('.primary').addEventListener('click', ()=>{
    e.date = date.value; e.category=cat.value; e.wallet=wallet.value;
    e.type=type.value; e.amount=Number(amount.value||0); e.note=note.value; e.kind=kind.value;
    persist(); rebuildSets(); rerender();
  });
  tr.querySelector('.mini:not(.primary)').addEventListener('click', rerender);
}

function renderResumo(){
  const arr=filtered(); const byCat={}, byWal={}, byKind={fixa:0, variavel:0};
  arr.forEach(e=>{
    const v = e.type==='expense'? -e.amount : e.amount;
    byCat[e.category]=(byCat[e.category]||0)+v;
    byWal[e.wallet]=(byWal[e.wallet]||0)+v;
    if(e.type==='expense') byKind[e.kind]=(byKind[e.kind]||0)+e.amount;
  });
  const ulc=qs('#sumByCategory'); ulc.innerHTML='';
  Object.keys(byCat).sort().forEach(k=>{ const li=document.createElement('li'); li.innerHTML=`<span>${k}</span><strong>${fmt(byCat[k])}</strong>`; ulc.appendChild(li); });
  const ulw=qs('#sumByWallet'); ulw.innerHTML='';
  Object.keys(byWal).sort().forEach(k=>{ const li=document.createElement('li'); li.innerHTML=`<span>${k}</span><strong>${fmt(byWal[k])}</strong>`; ulw.appendChild(li); });
  const ulkv=qs('#sumByKind'); ulkv.innerHTML='';
  ['fixa','variavel'].forEach(k=>{ const label=k==='fixa'?'Despesas Fixas':'Despesas Variáveis'; const li=document.createElement('li'); li.innerHTML=`<span>${label}</span><strong>- ${fmt(byKind[k]||0)}</strong>`; ulkv.appendChild(li); });
}

function renderBudgets(){
  const list=qs('#budgets'); list.innerHTML='';
  const arr=filtered(); const spent={};
  arr.filter(e=>e.type==='expense').forEach(e=> spent[e.category]=(spent[e.category]||0)+e.amount);
  Object.keys(state.budgets).sort().forEach(cat=>{
    const limit=state.budgets[cat]||0, used=spent[cat]||0, pct = limit>0 ? Math.min(100, Math.round(used/limit*100)) : 0;
    const cls=pct<80?'':(pct<100?'warn':'danger');
    const li=document.createElement('li');
    li.innerHTML=`<div><strong>${cat}</strong><div class="progress ${cls}"><div class="bar" style="width:${pct}%"></div></div></div>
                  <div class="badge">${fmt(used)} / ${fmt(limit)}</div>`;
    list.appendChild(li);
  });
}

function rerender(){
  renderOptions(); renderKPIs(); renderTable(); renderResumo(); renderBudgets();
}

function addEntryFromForm(ev){
  ev.preventDefault();
  const e = {
    id:uid(),
    date: qs('#date').value,
    category: qs('#category').value.trim(),
    wallet: qs('#wallet').value.trim(),
    type: qs('#type').value,
    kind: qs('#kind').value,
    amount: Number(qs('#amount').value||0),
    note: qs('#note').value.trim(),
    createdAt: Date.now()
  };
  state.entries.push(e);
  persist(); rebuildSets();
  ev.target.reset();
  qs('#date').valueAsDate = new Date();
  rerender();
}

function clearFilters(){ ['filterWallet','filterCategory','filterKind'].forEach(id=> qs('#'+id).value=''); rerender(); }

function openPDF(){ document.title = 'Relatório Financeiro — ' + mstr(); window.print(); }

/* Drawer + swipe */
(function(){
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('drawerOverlay');
  const btn = document.getElementById('btnMenu');
  let isOpen = false;
  function open(){ drawer.classList.add('show'); overlay.classList.add('show'); isOpen=true; }
  function close(){ drawer.classList.remove('show'); overlay.classList.remove('show'); isOpen=false; }
  btn?.addEventListener('click', open);
  overlay?.addEventListener('click', close);
  // edge swipe open
  let sx=null, sy=null, tracking=false;
  window.addEventListener('touchstart', (e)=>{ const t=e.touches[0]; if(t.clientX<24){ sx=t.clientX; sy=t.clientY; tracking=true; } }, {passive:true});
  window.addEventListener('touchmove', (e)=>{ if(!tracking) return; const t=e.touches[0]; const dx=t.clientX-sx, dy=t.clientY-sy; if(Math.abs(dx)>40 && Math.abs(dx)>Math.abs(dy)){ open(); tracking=false; } }, {passive:true});
  window.addEventListener('touchend', ()=> tracking=false, {passive:true});
  // swipe close
  drawer.addEventListener('touchstart', (e)=>{ const t=e.touches[0]; sx=t.clientX; sy=t.clientY; tracking=true; }, {passive:true});
  drawer.addEventListener('touchmove', (e)=>{ if(!tracking||!isOpen) return; const t=e.touches[0]; const dx=t.clientX-sx, dy=t.clientY-sy; if(dx<-40 && Math.abs(dx)>Math.abs(dy)){ close(); tracking=false; } }, {passive:true});
  document.querySelectorAll('.drawer nav a[data-go]').forEach(a=> a.addEventListener('click', (ev)=>{
    ev.preventDefault();
    const tab=a.dataset.go;
    document.querySelectorAll('.tabs button').forEach(b=> b.classList.remove('active'));
    document.querySelector(`.tabs button[data-tab="${tab}"]`)?.classList.add('active');
    document.querySelectorAll('.tab').forEach(s=> s.classList.remove('active'));
    document.getElementById('tab-'+tab).classList.add('active');
    close();
  }));
  document.getElementById('goPDF')?.addEventListener('click', (e)=>{ e.preventDefault(); close(); openPDF(); });
  document.getElementById('goReset')?.addEventListener('click', (e)=>{ e.preventDefault(); if(confirm('Apagar todos os dados locais?')){ localStorage.removeItem(LS.entries); localStorage.removeItem(LS.budgets); load(); rerender(); close(); }});
  document.getElementById('goAbout')?.addEventListener('click', (e)=>{ e.preventDefault(); alert('Financeiro Família — NuBlue\\nFeito para o Thiago. Dados apenas no seu dispositivo.'); close(); });
})();

function setup(){
  load();
  qs('#filterMonth').value = new Date().toISOString().slice(0,7);
  qs('#date').valueAsDate = new Date();
  rerender();

  // events
  qsa('.tabs button').forEach(b=> b.addEventListener('click', ()=>{
    qsa('.tabs button').forEach(x=>x.classList.remove('active')); b.classList.add('active');
    qsa('.tab').forEach(s=> s.classList.remove('active')); qs('#tab-'+b.dataset.tab).classList.add('active');
  }));
  ['filterMonth','filterWallet','filterCategory','filterKind'].forEach(id=> qs('#'+id)?.addEventListener('change', rerender));
  qs('#btnClearFilters').addEventListener('click', clearFilters);
  qs('#btnQuickIncome').addEventListener('click', ()=>{ document.querySelector('.tabs button[data-tab="planilha"]').click(); qs('#type').value='income'; qs('#date').valueAsDate=new Date(); qs('#amount').focus(); });
  qs('#btnQuickExpense').addEventListener('click', ()=>{ document.querySelector('.tabs button[data-tab="planilha"]').click(); qs('#type').value='expense'; qs('#date').valueAsDate=new Date(); qs('#amount').focus(); });
  qs('#btnQuickToday').addEventListener('click', ()=>{ qs('#date').valueAsDate=new Date(); });
  qs('#formEntry').addEventListener('submit', addEntryFromForm);
  qs('#btnPDF').addEventListener('click', openPDF);

  // PWA
  window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault(); qs('#btnInstall').style.display='inline-block'; qs('#btnInstall').onclick=()=> e.prompt();
  });
  if('serviceWorker' in navigator){ navigator.serviceWorker.register('./sw.js'); }
}

window.addEventListener('load', setup);
