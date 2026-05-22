// ============ STATE ============
let state = {
  apts: [],
  clients: [],
  services: [
    { id: uid(), name: 'Corte Masculino', price: 35, duration: 30 },
    { id: uid(), name: 'Corte Feminino', price: 60, duration: 60 },
    { id: uid(), name: 'Barba', price: 25, duration: 20 },
    { id: uid(), name: 'Coloração', price: 120, duration: 90 },
    { id: uid(), name: 'Hidratação', price: 50, duration: 45 },
  ],
  hours: ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00','18:00'],
  salonName: 'Studio Hair',
  darkMode: true
};
let editingAptId = null;
let editingClientId = null;
let editingServiceId = null;
let detailClientId = null;
let finTab = 'day';
let selectedDate = toDateStr(new Date());
let confirmCb = null;

function uid() { return Math.random().toString(36).slice(2, 10); }
function toDateStr(d) { return d.toISOString().slice(0, 10); }
function fmtBRL(v) { return 'R$ ' + parseFloat(v || 0).toFixed(2).replace('.', ','); }
function fmtDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'short' });
}
function today() { return toDateStr(new Date()); }
function getWeekStart() {
  const d = new Date(); d.setDate(d.getDate() - d.getDay()); return toDateStr(d);
}
function getMonthStart() {
  const d = new Date(); return toDateStr(new Date(d.getFullYear(), d.getMonth(), 1));
}

// ============ PERSIST ============
function save() { localStorage.setItem('sh_state', JSON.stringify(state)); }
function load() {
  const raw = localStorage.getItem('sh_state');
  if (raw) { try { state = { ...state, ...JSON.parse(raw) }; } catch(e) {} }
}

// ============ THEME ============
function applyTheme() {
  document.body.classList.toggle('light', !state.darkMode);
  const btn = document.querySelector('.top-bar .icon-btn');
  if (btn) btn.textContent = state.darkMode ? '🌙' : '☀️';
  const tog = document.getElementById('dark-toggle');
  if (tog) tog.checked = state.darkMode;
}
function toggleTheme() {
  state.darkMode = !state.darkMode;
  applyTheme(); save();
}

// ============ NAVIGATION ============
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.screen === id);
  });
  if (id === 'home') renderDashboard();
  if (id === 'agenda') renderAgenda();
  if (id === 'clients') renderClients();
  if (id === 'fin') renderFin();
  if (id === 'config') renderConfig();
}

// ============ DASHBOARD ============
function renderDashboard() {
  const now = new Date();
  document.getElementById('hero-date').textContent = now.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' });
  
  const todayApts = state.apts.filter(a => a.date === today());
  const doneApts = todayApts.filter(a => a.done);
  const total = doneApts.reduce((s, a) => s + parseFloat(a.value || 0), 0);
  
  document.getElementById('hero-total').textContent = fmtBRL(total);
  document.getElementById('stat-apts').textContent = todayApts.length;
  document.getElementById('stat-done').textContent = doneApts.length;
  document.getElementById('stat-pending').textContent = todayApts.filter(a => !a.done).length;
  
  // Next client
  const nowStr = now.toTimeString().slice(0,5);
  const upcoming = todayApts.filter(a => !a.done && a.time >= nowStr).sort((a,b) => a.time.localeCompare(b.time));
  const nc = document.getElementById('next-client-area');
  if (upcoming.length > 0) {
    const apt = upcoming[0];
    const svc = state.services.find(s => s.id === apt.serviceId);
    nc.innerHTML = `<div class="next-card" onclick="showScreen('agenda')">
      <div class="next-time"><div class="next-time-h">${apt.time.slice(0,2)}</div><div class="next-time-m">${apt.time.slice(3,5)}</div></div>
      <div class="next-info"><div class="next-name">${apt.client}</div><div class="next-service">${svc ? svc.name : apt.service}</div></div>
      <div class="next-val">${fmtBRL(apt.value)}</div>
    </div>`;
  } else {
    nc.innerHTML = `<div style="padding:0 16px"><div class="card" style="text-align:center;color:var(--text-muted);padding:20px;"><span style="font-size:28px">✨</span><div style="margin-top:8px;font-size:14px;">Sem próximos clientes hoje</div></div></div>`;
  }
  
  // Today list
  const list = document.getElementById('home-apt-list');
  if (todayApts.length === 0) {
    list.innerHTML = `<div class="empty-state" style="padding:24px"><div class="empty-icon">📅</div><div class="empty-text">Nenhum agendamento hoje</div></div>`;
  } else {
    list.innerHTML = todayApts.sort((a,b)=>a.time.localeCompare(b.time)).map(a => aptCardHTML(a, true)).join('');
  }
}

// ============ AGENDA ============
function renderDateStrip() {
  const strip = document.getElementById('date-strip');
  const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  let html = '';
  for (let i = -3; i <= 14; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    const ds = toDateStr(d);
    const hasApts = state.apts.some(a => a.date === ds);
    const active = ds === selectedDate ? 'active' : '';
    const hasClass = hasApts ? 'has-apts' : '';
    html += `<div class="date-chip ${active} ${hasClass}" onclick="selectDate('${ds}')">
      <div class="dc-day">${days[d.getDay()]}</div>
      <div class="dc-num">${d.getDate()}</div>
    </div>`;
  }
  strip.innerHTML = html;
  setTimeout(() => {
    const active = strip.querySelector('.date-chip.active');
    if (active) active.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' });
  }, 50);
}

function selectDate(ds) {
  selectedDate = ds;
  renderDateStrip();
  renderAptList();
}

function renderAgenda() {
  renderDateStrip();
  renderAptList();
}

function renderAptList() {
  const list = document.getElementById('agenda-list');
  const dayApts = state.apts.filter(a => a.date === selectedDate).sort((a,b) => a.time.localeCompare(b.time));
  if (dayApts.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🗓️</div><div class="empty-text">Nenhum agendamento<br>neste dia</div></div>`;
  } else {
    list.innerHTML = dayApts.map(a => aptCardHTML(a)).join('');
  }
}

function aptCardHTML(apt, compact = false) {
  const svc = state.services.find(s => s.id === apt.serviceId);
  const svcName = svc ? svc.name : (apt.service || '—');
  const doneClass = apt.done ? 'done' : '';
  const statusClass = apt.done ? 'status-done' : 'status-pending';
  const doneIcon = apt.done ? '✅' : '✔';
  return `<div class="apt-card ${doneClass}" id="apt-${apt.id}">
    <div class="apt-status ${statusClass}"></div>
    <div class="apt-time">${apt.time}</div>
    <div class="apt-body">
      <div class="apt-name">${apt.client}</div>
      <div class="apt-service">${svcName}${apt.obs ? ' · ' + apt.obs : ''}</div>
    </div>
    <div class="apt-val">${fmtBRL(apt.value)}</div>
    <div class="apt-actions">
      ${!apt.done ? `<button class="apt-btn btn-done" onclick="toggleDone('${apt.id}')" title="Concluir">✔</button>` : `<button class="apt-btn btn-done" onclick="toggleDone('${apt.id}')" title="Desfazer">↩</button>`}
      <button class="apt-btn btn-edit" onclick="editApt('${apt.id}')" title="Editar">✏</button>
      <button class="apt-btn btn-del" onclick="deleteApt('${apt.id}')" title="Excluir">🗑</button>
    </div>
  </div>`;
}

function toggleDone(id) {
  const apt = state.apts.find(a => a.id === id);
  if (!apt) return;
  apt.done = !apt.done;
  save();
  // Auto-add client
  if (apt.done && apt.client) {
    const exists = state.clients.find(c => c.name.toLowerCase() === apt.client.toLowerCase());
    if (!exists) {
      state.clients.push({ id: uid(), name: apt.client, phone: '' });
      save();
    }
  }
  showToast(apt.done ? '✅ Atendimento concluído!' : '↩ Marcado como pendente', 'success');
  renderCurrent();
}

function deleteApt(id) {
  showConfirm('Excluir agendamento?', 'Esta ação não pode ser desfeita.', () => {
    const el = document.getElementById('apt-' + id);
    if (el) { el.classList.add('removing'); setTimeout(() => { state.apts = state.apts.filter(a => a.id !== id); save(); renderCurrent(); }, 250); }
    else { state.apts = state.apts.filter(a => a.id !== id); save(); renderCurrent(); }
  });
}

function editApt(id) {
  const apt = state.apts.find(a => a.id === id);
  if (!apt) return;
  editingAptId = id;
  document.getElementById('modal-apt-title').textContent = 'Editar Agendamento';
  document.getElementById('apt-client').value = apt.client;
  document.getElementById('apt-date').value = apt.date;
  document.getElementById('apt-time').value = apt.time;
  document.getElementById('apt-value').value = apt.value;
  document.getElementById('apt-obs').value = apt.obs || '';
  fillServiceSelect(apt.serviceId);
  openModal('modal-apt');
}

// ============ NEW APPOINTMENT ============
function openNewApt() {
  editingAptId = null;
  document.getElementById('modal-apt-title').textContent = 'Novo Agendamento';
  document.getElementById('apt-client').value = '';
  document.getElementById('apt-date').value = selectedDate;
  document.getElementById('apt-time').value = '';
  document.getElementById('apt-value').value = '';
  document.getElementById('apt-obs').value = '';
  fillServiceSelect(null);
  fillClientsDatalist();
  openModal('modal-apt');
}

function fillServiceSelect(selectedId) {
  const sel = document.getElementById('apt-service');
  sel.innerHTML = '<option value="">Selecionar serviço</option>' + state.services.map(s => `<option value="${s.id}" ${s.id === selectedId ? 'selected':''} data-price="${s.price}">${s.name} — ${fmtBRL(s.price)}</option>`).join('');
}

function fillServicePrice() {
  const sel = document.getElementById('apt-service');
  const opt = sel.options[sel.selectedIndex];
  if (opt && opt.dataset.price) document.getElementById('apt-value').value = opt.dataset.price;
}

function fillClientsDatalist() {
  document.getElementById('clients-datalist').innerHTML = state.clients.map(c => `<option value="${c.name}">`).join('');
}

function saveApt() {
  const client = document.getElementById('apt-client').value.trim();
  const serviceId = document.getElementById('apt-service').value;
  const date = document.getElementById('apt-date').value;
  const time = document.getElementById('apt-time').value;
  const value = document.getElementById('apt-value').value;
  if (!client || !date || !time) { showToast('⚠️ Preencha cliente, data e horário', 'error'); return; }
  const svc = state.services.find(s => s.id === serviceId);
  if (editingAptId) {
    const apt = state.apts.find(a => a.id === editingAptId);
    Object.assign(apt, { client, serviceId, service: svc ? svc.name : '', date, time, value: parseFloat(value) || 0, obs: document.getElementById('apt-obs').value });
  } else {
    state.apts.push({ id: uid(), client, serviceId, service: svc ? svc.name : '', date, time, value: parseFloat(value) || 0, obs: document.getElementById('apt-obs').value, done: false });
  }
  save();
  closeModal('modal-apt');
  showToast(editingAptId ? '✏️ Agendamento atualizado!' : '✅ Agendamento criado!', 'success');
  renderCurrent();
}

// ============ CLIENTS ============
function renderClients() {
  const q = (document.getElementById('client-search')?.value || '').toLowerCase();
  const filtered = state.clients.filter(c => c.name.toLowerCase().includes(q));
  const list = document.getElementById('clients-list');
  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">👤</div><div class="empty-text">${q ? 'Nenhum resultado' : 'Nenhum cliente cadastrado'}</div></div>`;
    return;
  }
  list.innerHTML = filtered.map(c => {
    const visits = state.apts.filter(a => a.client.toLowerCase() === c.name.toLowerCase() && a.done).length;
    const init = c.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    return `<div class="client-card" onclick="showClientDetail('${c.id}')">
      <div class="client-avatar">${init}</div>
      <div class="client-info">
        <div class="client-name">${c.name}</div>
        <div class="client-phone">${c.phone || 'Sem telefone'}</div>
        <div class="client-count">${visits} visita${visits !== 1 ? 's' : ''}</div>
      </div>
      <div class="client-chevron">›</div>
    </div>`;
  }).join('');
}

function openAddClient() {
  editingClientId = null;
  document.getElementById('modal-client-title').textContent = 'Novo Cliente';
  document.getElementById('client-name-input').value = '';
  document.getElementById('client-phone-input').value = '';
  openModal('modal-client');
}

function saveClient() {
  const name = document.getElementById('client-name-input').value.trim();
  const phone = document.getElementById('client-phone-input').value.trim();
  if (!name) { showToast('⚠️ Informe o nome', 'error'); return; }
  if (editingClientId) {
    const c = state.clients.find(c => c.id === editingClientId);
    Object.assign(c, { name, phone });
  } else {
    state.clients.push({ id: uid(), name, phone });
  }
  save(); closeModal('modal-client');
  showToast('✅ Cliente salvo!', 'success');
  renderClients();
}

function showClientDetail(id) {
  const c = state.clients.find(c => c.id === id);
  if (!c) return;
  detailClientId = id;
  const init = c.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('detail-avatar').textContent = init;
  document.getElementById('detail-name').textContent = c.name;
  document.getElementById('detail-phone').textContent = c.phone || 'Sem telefone';
  const hist = state.apts.filter(a => a.client.toLowerCase() === c.name.toLowerCase() && a.done).sort((a,b)=>b.date.localeCompare(a.date));
  document.getElementById('detail-count').textContent = hist.length;
  document.getElementById('detail-total').textContent = fmtBRL(hist.reduce((s,a)=>s+parseFloat(a.value||0),0));
  const histDiv = document.getElementById('detail-history');
  if (hist.length === 0) { histDiv.innerHTML = '<div style="color:var(--text-muted);font-size:14px;padding:8px 0">Nenhum atendimento ainda</div>'; }
  else { histDiv.innerHTML = hist.map(a => { const svc = state.services.find(s=>s.id===a.serviceId); return `<div class="history-item"><div class="h-date">${fmtDate(a.date).slice(0,6)}</div><div class="h-service">${svc?svc.name:a.service||'—'}</div><div class="h-val">${fmtBRL(a.value)}</div></div>`; }).join(''); }
  openModal('modal-client-detail');
}

function deleteCurrentClient() {
  showConfirm('Excluir cliente?', 'O histórico de agendamentos será mantido.', () => {
    state.clients = state.clients.filter(c => c.id !== detailClientId);
    save(); closeModal('modal-client-detail');
    showToast('🗑️ Cliente excluído', 'success');
    renderClients();
  });
}

// ============ SERVIÇOS ============
function renderServicesConfig() {
  const icons = ['✂️','💇','🪒','🎨','💆','🧴','💅','🌿'];
  const con = document.getElementById('services-config');
  if (!con) return;
  con.innerHTML = state.services.map((s, i) => `<div class="service-card">
    <div class="service-icon">${icons[i % icons.length]}</div>
    <div class="service-info"><div class="service-name">${s.name}</div><div class="service-dur">${s.duration} min</div></div>
    <div class="service-price">${fmtBRL(s.price)}</div>
    <div class="service-actions">
      <button class="apt-btn btn-edit" onclick="editService('${s.id}')">✏</button>
      <button class="apt-btn btn-del" onclick="deleteService('${s.id}')">🗑</button>
    </div>
  </div>`).join('');
}

function openAddService() {
  editingServiceId = null;
  document.getElementById('modal-service-title').textContent = 'Novo Serviço';
  document.getElementById('service-name-input').value = '';
  document.getElementById('service-price-input').value = '';
  document.getElementById('service-dur-input').value = '';
  openModal('modal-service');
}

function editService(id) {
  const s = state.services.find(s => s.id === id);
  if (!s) return;
  editingServiceId = id;
  document.getElementById('modal-service-title').textContent = 'Editar Serviço';
  document.getElementById('service-name-input').value = s.name;
  document.getElementById('service-price-input').value = s.price;
  document.getElementById('service-dur-input').value = s.duration;
  openModal('modal-service');
}

function saveService() {
  const name = document.getElementById('service-name-input').value.trim();
  const price = parseFloat(document.getElementById('service-price-input').value) || 0;
  const duration = parseInt(document.getElementById('service-dur-input').value) || 30;
  if (!name) { showToast('⚠️ Informe o nome do serviço', 'error'); return; }
  if (editingServiceId) {
    const s = state.services.find(s => s.id === editingServiceId);
    Object.assign(s, { name, price, duration });
  } else {
    state.services.push({ id: uid(), name, price, duration });
  }
  save(); closeModal('modal-service');
  showToast('✅ Serviço salvo!', 'success');
  renderConfig();
}

function deleteService(id) {
  showConfirm('Excluir serviço?', 'Agendamentos existentes não serão afetados.', () => {
    state.services = state.services.filter(s => s.id !== id);
    save(); showToast('🗑️ Serviço excluído', 'success');
    renderConfig();
  });
}

// ============ FINANCEIRO ============
function setFinTab(tab, el) {
  finTab = tab;
  document.querySelectorAll('.fin-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderFin();
}

function renderFin() {
  const now = today();
  const ws = getWeekStart();
  const ms = getMonthStart();
  let filtered;
  if (finTab === 'day') filtered = state.apts.filter(a => a.date === now && a.done);
  else if (finTab === 'week') filtered = state.apts.filter(a => a.date >= ws && a.date <= now && a.done);
  else filtered = state.apts.filter(a => a.date >= ms && a.date <= now && a.done);
  
  const total = filtered.reduce((s,a) => s + parseFloat(a.value||0), 0);
  const avg = filtered.length ? total / filtered.length : 0;
  
  const labels = { day:'Hoje', week:'Semana', month:'Mês' };
  document.getElementById('fin-summary').innerHTML = `
    <div class="fin-card span2"><div class="fin-card-label">Total ${labels[finTab]}</div><div class="fin-card-val">${fmtBRL(total)}</div><div class="fin-card-count">${filtered.length} atendimento${filtered.length!==1?'s':''}</div></div>
    <div class="fin-card"><div class="fin-card-label">Ticket Médio</div><div class="fin-card-val" style="font-size:22px">${fmtBRL(avg)}</div></div>
    <div class="fin-card"><div class="fin-card-label">Atendimentos</div><div class="fin-card-val" style="font-size:22px">${filtered.length}</div></div>
  `;
  
  const finList = document.getElementById('fin-list');
  if (filtered.length === 0) {
    finList.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-muted)">Nenhum atendimento neste período</div>';
  } else {
    const sorted = [...filtered].sort((a,b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
    finList.innerHTML = sorted.map(a => { const svc = state.services.find(s=>s.id===a.serviceId); return `<div class="fin-item"><div class="fin-dot"></div><div class="fin-item-info"><div class="fin-item-name">${a.client}</div><div class="fin-item-sub">${svc?svc.name:a.service||'—'} · ${fmtDate(a.date)}</div></div><div class="fin-item-val">+${fmtBRL(a.value)}</div></div>`; }).join('');
  }
}

// ============ CONFIG ============
function renderConfig() {
  const salonInput = document.getElementById('salon-name-input');
  if (salonInput) salonInput.value = state.salonName;
  const display = document.getElementById('salon-name-display');
  if (display) display.textContent = state.salonName;
  
  // Hours grid
  const hg = document.getElementById('hours-grid');
  if (hg) {
    const allHours = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
    hg.innerHTML = allHours.map(h => `<div class="hour-chip ${state.hours.includes(h)?'active':''}" onclick="toggleHour('${h}')">${h}</div>`).join('');
  }
  
  renderServicesConfig();
  applyTheme();
}

function saveSalonName() {
  state.salonName = document.getElementById('salon-name-input').value;
  document.getElementById('salon-name-display').textContent = state.salonName || 'Studio Hair';
  save();
}

function toggleHour(h) {
  const idx = state.hours.indexOf(h);
  if (idx >= 0) state.hours.splice(idx, 1);
  else state.hours.push(h);
  state.hours.sort();
  save();
  renderConfig();
}

// ============ MODAL ============
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Close on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay.id); });
});

// ============ CONFIRM ============
function showConfirm(title, msg, cb) {
  confirmCb = cb;
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent = msg;
  document.getElementById('confirm-dialog').classList.add('open');
}
function closeConfirm() { document.getElementById('confirm-dialog').classList.remove('open'); confirmCb = null; }
document.getElementById('confirm-ok-btn').onclick = () => { closeConfirm(); if (confirmCb) confirmCb(); };
document.getElementById('confirm-dialog').addEventListener('click', e => { if (e.target === e.currentTarget) closeConfirm(); });

// ============ TOAST ============
let toastTimer;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ============ MISC ============
function renderCurrent() {
  const active = document.querySelector('.screen.active');
  if (!active) return;
  const id = active.id.replace('screen-', '');
  showScreen(id);
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'studio-hair-backup.json'; a.click();
  showToast('📤 Dados exportados!', 'success');
}

function confirmClear() {
  showConfirm('Limpar todos os dados?', 'Todos os agendamentos, clientes e configurações serão apagados permanentemente.', () => {
    localStorage.removeItem('sh_state');
    location.reload();
  });
}

// ============ INIT ============
load();
applyTheme();
renderDashboard();
renderConfig();
