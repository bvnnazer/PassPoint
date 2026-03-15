// ═══════════════════════════════════════════
//  PASSPOINT — Teacher Portal JS
// ═══════════════════════════════════════════
const LS_KEY = 'passpoint_v2';

const STUDENTS_DB = [
  { name:'Geo Sumanga',      lrn:'123456789001' },
  { name:'Ana Reyes',        lrn:'123456789002' },
  { name:'Marco Cruz',       lrn:'123456789003' },
  { name:'Lena Santos',      lrn:'123456789004' },
  { name:'Ryan Tan',         lrn:'123456789005' },
  { name:'Maria Flores',     lrn:'123456789006' },
  { name:'Jed Ocampo',       lrn:'123456789007' },
  { name:'Carla Dizon',      lrn:'123456789008' },
  { name:'Ben Lim',          lrn:'123456789009' },
  { name:'Grace Mendoza',    lrn:'123456789010' },
];

const CLASSES = ['Data Structures','Web Development','Database Systems','Software Engineering','Cybersecurity'];

const CLASS_INFO = [
  { name:'Data Structures',     room:'PH 406', teacher:'Reuben Mallorca', days:'Mon Wed Fri', time:'7:30-8:30 AM'   },
  { name:'Web Development',     room:'PH 402', teacher:'Maria Santos',    days:'Mon Wed Fri', time:'9:00-10:00 AM'  },
  { name:'Database Systems',    room:'PH 405', teacher:'Jose Reyes',      days:'Tue Thu',     time:'10:30-11:30 AM' },
  { name:'Software Engineering',room:'PH 408', teacher:'Ana Cruz',        days:'Tue Thu',     time:'1:00-2:00 PM'   },
  { name:'Cybersecurity',       room:'PH 410', teacher:'Mark Lim',        days:'Mon Wed',     time:'2:30-3:30 PM'   },
];

function getAll()   { try { return JSON.parse(localStorage.getItem(LS_KEY)||'[]'); } catch { return []; } }
function saveAll(a) { localStorage.setItem(LS_KEY, JSON.stringify(a)); }
function todayStr() { return new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}); }
function initials(n) { return n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(); }
function badge(s) { return '<span class="badge '+s+'">'+s.toUpperCase()+'</span>'; }
function nameCell(n) {
  return '<div style="display:flex;align-items:center;gap:9px"><div style="width:28px;height:28px;border-radius:50%;background:var(--green);color:white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0">'+initials(n)+'</div><span style="font-weight:500">'+n+'</span></div>';
}

window.onload = () => {
  injectDemoRecord();
  if (document.getElementById('dash-scans'))     renderDashboard();
  if (document.getElementById('live-tbody'))     renderLive();
  if (document.getElementById('students-tbody')) renderStudents();
  if (document.getElementById('records-tbody'))  renderRecords();
  if (document.getElementById('class-cards'))    renderMyClasses();
  if (document.getElementById('overview-cards')) renderOverview();
  setInterval(() => {
    if (document.getElementById('live-tbody'))  renderLive();
    if (document.getElementById('dash-scans'))  renderDashboard();
  }, 5000);
};

function injectDemoRecord() {
  const all = getAll(), today = todayStr();
  if (all.some(r => r.lrn==='123456789001' && r.date===today && r.subject==='Web Development')) return;
  all.push({ lrn:'123456789001', name:'Geo Sumanga', date:today, subject:'Web Development', room:'PH 402', timeIn:'9:03 AM', status:'present', notes:'' });
  saveAll(all);
}

function renderDashboard() {
  const all = getAll(), today = all.filter(r=>r.date===todayStr());
  const scanned = [...new Map(today.map(r=>[r.lrn,r])).values()];
  const p = scanned.filter(r=>r.status==='present').length;
  const l = scanned.filter(r=>r.status==='late').length;
  const a = Math.max(0, STUDENTS_DB.length - scanned.length);
  const rate = STUDENTS_DB.length ? Math.round((p+l)/STUDENTS_DB.length*100) : 0;
  document.getElementById('t-date-sub').textContent = new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})+' · BSIT 2-12';
  document.getElementById('t-rate').textContent = rate+'%';
  document.getElementById('t-present').textContent = p+l;
  document.getElementById('t-absent').textContent = a;
  document.getElementById('t-late').textContent = l;
  const recent = [...today].reverse().slice(0,6);
  document.getElementById('dash-scans').innerHTML = recent.length ? recent.map(r=>'<tr><td>'+nameCell(r.name)+'</td><td class="mono">'+r.timeIn+'</td><td style="font-size:12px">'+r.subject+'</td><td>'+badge(r.status)+'</td></tr>').join('') : '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:16px">No scans yet today</td></tr>';
  document.getElementById('t-subject-bars').innerHTML = CLASSES.map((c,i)=>{
    const sr = all.filter(r=>r.subject===c);
    const pct = sr.length ? Math.round(sr.filter(r=>r.status!=='absent').length/sr.length*100) : 0;
    const cls = pct>=80?'good':pct>=60?'risk':'low';
    return '<div class="subject-row"'+(i===CLASSES.length-1?' style="margin-bottom:0"':'')+'>'+
      '<div class="subject-header"><span class="subject-name">'+c+'</span><div><span class="subject-pct">'+pct+'%</span><span class="subject-status '+cls+'">'+(cls==='good'?'Good':cls==='risk'?'Risk':'Low')+'</span></div></div>'+
      '<div class="bar-track"><div class="bar-fill '+cls+'" data-width="'+pct+'"></div></div></div>';
  }).join('');
  setTimeout(()=>{ document.querySelectorAll('.bar-fill').forEach(b=>{ b.style.width=b.dataset.width+'%'; }); },100);
}

function renderLive() {
  const subj=document.getElementById('live-subj-filter')?.value||'';
  const status=document.getElementById('live-status-filter')?.value||'';
  const search=document.getElementById('live-search')?.value.toLowerCase()||'';
  let recs=getAll().filter(r=>r.date===todayStr());
  if(subj) recs=recs.filter(r=>r.subject===subj);
  if(status) recs=recs.filter(r=>r.status===status.toLowerCase());
  if(search) recs=recs.filter(r=>r.name.toLowerCase().includes(search)||r.lrn.includes(search));
  document.getElementById('live-date').textContent=new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
  document.getElementById('live-count').textContent=recs.length+' scan'+(recs.length!==1?'s':'');
  document.getElementById('live-tbody').innerHTML=recs.length ? [...recs].reverse().map(r=>
    '<tr><td>'+nameCell(r.name)+'</td><td class="mono">'+r.lrn+'</td><td class="mono">'+r.timeIn+'</td><td style="font-size:12px">'+r.subject+'</td><td>'+badge(r.status)+'</td><td><button class="btn btn-outline btn-sm" onclick="editStatus(\''+r.lrn+'\',\''+r.subject+'\',\''+r.date+'\',\''+r.status+'\')">Edit</button></td></tr>'
  ).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:20px">No records match your filters</td></tr>';
}

let _editCtx=null;
function editStatus(lrn,subj,date,currentStatus) {
  _editCtx={lrn,subj,date};
  const s=STUDENTS_DB.find(s=>s.lrn===lrn);
  document.getElementById('modal-student').textContent=(s?.name||lrn)+'  ·  '+subj+'  ·  '+date;
  document.querySelectorAll('.modal-status-btn').forEach(btn=>{
    const is=btn.dataset.status===currentStatus;
    btn.style.borderColor=is?'var(--green)':'var(--border)';
    btn.style.background=is?'var(--green-hover)':'white';
  });
  document.getElementById('edit-modal').style.display='flex';
}
function applyStatus(newStatus) {
  if(!_editCtx) return;
  const all=getAll();
  const idx=all.findIndex(r=>r.lrn===_editCtx.lrn&&r.subject===_editCtx.subj&&r.date===_editCtx.date);
  if(idx>-1){ all[idx].status=newStatus; saveAll(all); renderLive?.(); renderDashboard?.(); showToast('Status updated to '+newStatus); }
  closeModal();
}
function closeModal() { document.getElementById('edit-modal').style.display='none'; _editCtx=null; }

function renderStudents(filter='') {
  const all=getAll();
  const list=filter?STUDENTS_DB.filter(s=>s.name.toLowerCase().includes(filter)||s.lrn.includes(filter)):STUDENTS_DB;
  document.getElementById('students-tbody').innerHTML=list.map(s=>{
    const recs=all.filter(r=>r.lrn===s.lrn);
    const p=recs.filter(r=>r.status==='present').length, l=recs.filter(r=>r.status==='late').length, a=recs.filter(r=>r.status==='absent').length;
    const total=p+l+a, rate=total?Math.round((p+l)/total*100):0;
    const rc=rate>=80?'var(--green)':rate>=60?'var(--yellow)':'var(--red)';
    const last=[...recs].reverse()[0];
    return '<tr><td>'+nameCell(s.name)+'</td><td class="mono">'+s.lrn+'</td><td style="color:var(--green);font-weight:600">'+(p+l)+'</td><td style="color:var(--yellow);font-weight:600">'+l+'</td><td style="color:var(--red);font-weight:600">'+a+'</td><td style="font-weight:700;color:'+rc+'">'+rate+'%</td><td style="font-size:12px;color:var(--muted)">'+(last?last.date+' '+last.timeIn:'—')+'</td></tr>';
  }).join('');
}
function filterStudents(v) { renderStudents(v.toLowerCase()); }

function getFilteredRecords() {
  let recs=getAll();
  const date=document.getElementById('rec-date')?.value;
  const subj=document.getElementById('rec-subj')?.value;
  const sts=document.getElementById('rec-status')?.value;
  const q=document.getElementById('rec-search')?.value.toLowerCase()||'';
  if(date){ const d=new Date(date).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}); recs=recs.filter(r=>r.date===d); }
  if(subj) recs=recs.filter(r=>r.subject===subj);
  if(sts)  recs=recs.filter(r=>r.status===sts.toLowerCase());
  if(q)    recs=recs.filter(r=>r.name.toLowerCase().includes(q)||r.lrn.includes(q));
  return recs;
}

function renderRecords() {
  const recs=getFilteredRecords();
  document.getElementById('rec-count').textContent=recs.length+' records';
  document.getElementById('records-tbody').innerHTML=recs.length
    ? [...recs].reverse().slice(0,50).map(r=>'<tr><td>'+nameCell(r.name)+'</td><td class="mono">'+r.lrn+'</td><td style="font-size:12px;color:var(--muted)">'+r.date+'</td><td style="font-size:12px">'+r.subject+'</td><td class="mono">'+r.timeIn+'</td><td>'+badge(r.status)+'</td></tr>').join('')
    : '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:20px">No records found</td></tr>';
}

function exportCSV() {
  const recs=getFilteredRecords();
  if(!recs.length){ showToast('No records to export'); return; }
  const headers=['Name','Student ID','Date','Subject','Time In','Status'];
  const rows=[...recs].reverse().map(r=>[ '"'+r.name+'"', r.lrn, '"'+r.date+'"', '"'+r.subject+'"', r.timeIn, r.status ].join(','));
  const csv=[headers.join(','),...rows].join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const filename='attendance_'+new Date().toISOString().slice(0,10)+'.csv';
  a.href=url; a.download=filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
  showToast('Exported '+recs.length+' records as '+filename);
}

function renderFlagged() { renderOverview(); }

function renderOverview() {
  const all=getAll(), cardsEl=document.getElementById('overview-cards');
  if(!cardsEl) return;
  cardsEl.innerHTML=CLASSES.map(subj=>{
    const recs=all.filter(r=>r.subject===subj);
    const p=recs.filter(r=>r.status==='present').length, l=recs.filter(r=>r.status==='late').length, a=recs.filter(r=>r.status==='absent').length;
    const scanned=recs.length, rate=scanned?Math.round((p+l)/scanned*100):0;
    const passing=STUDENTS_DB.filter(s=>{ const sr=all.filter(r=>r.lrn===s.lrn&&r.subject===subj); return sr.length&&Math.round(sr.filter(r=>r.status!=='absent').length/sr.length*100)>=80; }).length;
    const failing=STUDENTS_DB.filter(s=>{ const sr=all.filter(r=>r.lrn===s.lrn&&r.subject===subj); return sr.length&&Math.round(sr.filter(r=>r.status!=='absent').length/sr.length*100)<80; }).length;
    const bc=rate>=80?'var(--green)':rate>=60?'var(--yellow)':'var(--red)';
    return '<div class="card" style="margin-bottom:0;padding:16px 18px"><div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">'+
      '<div style="min-width:170px;flex:1"><div style="font-size:14px;font-weight:700;margin-bottom:2px">'+subj+'</div><div style="font-size:11px;color:var(--muted)">'+scanned+' total scans</div></div>'+
      '<div style="display:flex;gap:20px;flex-shrink:0">'+
        '<div style="text-align:center"><div style="font-size:18px;font-weight:700;color:var(--green)">'+(p+l)+'</div><div style="font-size:10px;color:var(--muted);font-weight:600;text-transform:uppercase">Present</div></div>'+
        '<div style="text-align:center"><div style="font-size:18px;font-weight:700;color:var(--yellow)">'+l+'</div><div style="font-size:10px;color:var(--muted);font-weight:600;text-transform:uppercase">Late</div></div>'+
        '<div style="text-align:center"><div style="font-size:18px;font-weight:700;color:var(--red)">'+a+'</div><div style="font-size:10px;color:var(--muted);font-weight:600;text-transform:uppercase">Absent</div></div>'+
      '</div>'+
      '<div style="width:1px;height:36px;background:var(--border);flex-shrink:0"></div>'+
      '<div style="display:flex;gap:10px;flex-shrink:0">'+
        '<div style="background:var(--green-light);border:1px solid var(--green-mid);border-radius:8px;padding:6px 14px;text-align:center"><div style="font-size:18px;font-weight:700;color:var(--green)">'+passing+'</div><div style="font-size:10px;color:var(--green-dark);font-weight:700;text-transform:uppercase">Passing</div></div>'+
        '<div style="background:var(--red-light);border:1px solid #fca5a5;border-radius:8px;padding:6px 14px;text-align:center"><div style="font-size:18px;font-weight:700;color:var(--red)">'+failing+'</div><div style="font-size:10px;color:#b91c1c;font-weight:700;text-transform:uppercase">Failing</div></div>'+
      '</div>'+
      '<div style="min-width:120px;flex-shrink:0"><div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="font-size:12px;color:var(--muted)">Class Rate</span><span style="font-size:13px;font-weight:700;color:'+bc+'">'+rate+'%</span></div>'+
      '<div style="background:var(--border);border-radius:6px;height:7px;overflow:hidden"><div style="height:100%;border-radius:6px;background:'+bc+';width:'+rate+'%;transition:width 0.5s ease"></div></div></div>'+
      '</div></div>';
  }).join('');
  renderOverviewTable();
}

function renderOverviewTable() {
  const all=getAll(), filter=document.getElementById('ov-subj-filter')?.value||'';
  const subjects=filter?[filter]:CLASSES, tbody=document.getElementById('overview-tbody');
  if(!tbody) return;
  const rows=[];
  STUDENTS_DB.forEach(s=>{ subjects.forEach(subj=>{ const recs=all.filter(r=>r.lrn===s.lrn&&r.subject===subj); const p=recs.filter(r=>r.status==='present').length, l=recs.filter(r=>r.status==='late').length, a=recs.filter(r=>r.status==='absent').length, total=recs.length, rate=total?Math.round((p+l)/total*100):0; rows.push({s,subj,p,l,a,total,rate,standing:total===0?'no-data':rate>=80?'passing':'failing'}); }); });
  if(!rows.length||rows.every(r=>r.total===0)){ tbody.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:20px">No records yet</td></tr>'; return; }
  tbody.innerHTML=rows.map(r=>{
    const rc=r.rate>=80?'var(--green)':r.rate>=60?'var(--yellow)':'var(--red)';
    const se=r.standing==='no-data'?'<span style="font-size:11px;color:var(--muted)">No data</span>':r.standing==='passing'?'<span class="badge present">PASSING</span>':'<span class="badge absent">FAILING</span>';
    return '<tr><td>'+nameCell(r.s.name)+'</td><td style="font-size:12px;color:var(--muted)">'+r.subj+'</td><td style="color:var(--green);font-weight:600">'+(r.p+r.l)+'</td><td style="color:var(--yellow);font-weight:600">'+r.l+'</td><td style="color:var(--red);font-weight:600">'+r.a+'</td><td style="font-weight:700;color:'+rc+'">'+( r.total?r.rate+'%':'—')+'</td><td>'+se+'</td></tr>';
  }).join('');
}

function renderMyClasses() {
  const all=getAll(), cardsEl=document.getElementById('class-cards');
  if(!cardsEl) return;
  cardsEl.innerHTML=CLASS_INFO.map(c=>{
    const recs=all.filter(r=>r.subject===c.name);
    const present=recs.filter(r=>r.status!=='absent').length, rate=recs.length?Math.round(present/recs.length*100):0;
    const passing=STUDENTS_DB.filter(s=>{ const sr=all.filter(r=>r.lrn===s.lrn&&r.subject===c.name); return sr.length&&Math.round(sr.filter(r=>r.status!=='absent').length/sr.length*100)>=80; }).length;
    const rc=rate>=80?'var(--green)':rate>=60?'var(--yellow)':'var(--red)';
    return '<div class="card" style="margin-bottom:0;cursor:pointer;transition:border-color 0.15s" onmouseenter="this.style.borderColor=\'var(--green)\'" onmouseleave="this.style.borderColor=\'var(--border)\'" onclick="selectClass(\''+c.name+'\')">'+
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px"><div><div style="font-size:15px;font-weight:700;margin-bottom:2px">'+c.name+'</div><div style="font-size:12px;color:var(--muted)">'+c.room+' &nbsp;·&nbsp; '+c.teacher+'</div></div>'+
      '<div style="background:var(--green-light);border-radius:7px;padding:4px 10px;font-size:11px;font-weight:700;color:var(--green-dark);white-space:nowrap">'+c.days+'</div></div>'+
      '<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);margin-bottom:14px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'+c.time+'</div>'+
      '<div style="display:flex;gap:0;border:1px solid var(--border);border-radius:8px;overflow:hidden">'+
        '<div style="flex:1;padding:8px 12px;border-right:1px solid var(--border);text-align:center"><div style="font-size:16px;font-weight:700;color:var(--green)">'+passing+'</div><div style="font-size:10px;color:var(--muted);font-weight:600;text-transform:uppercase">Passing</div></div>'+
        '<div style="flex:1;padding:8px 12px;border-right:1px solid var(--border);text-align:center"><div style="font-size:16px;font-weight:700;color:var(--red)">'+(STUDENTS_DB.length-passing)+'</div><div style="font-size:10px;color:var(--muted);font-weight:600;text-transform:uppercase">Failing</div></div>'+
        '<div style="flex:1;padding:8px 12px;text-align:center"><div style="font-size:16px;font-weight:700;color:'+rc+'">'+rate+'%</div><div style="font-size:10px;color:var(--muted);font-weight:600;text-transform:uppercase">Class Rate</div></div>'+
      '</div></div>';
  }).join('');
  renderClassStudents();
}

function selectClass(name) { const f=document.getElementById('cls-filter'); if(f){ f.value=name; renderClassStudents(); } }

function renderClassStudents() {
  const all=getAll(), filter=document.getElementById('cls-filter')?.value||'';
  const label=document.getElementById('cls-selected-label');
  if(label) label.textContent=filter||'All Classes';
  const tbody=document.getElementById('class-students-tbody');
  if(!tbody) return;
  tbody.innerHTML=STUDENTS_DB.map((s,i)=>{
    const recs=filter?all.filter(r=>r.lrn===s.lrn&&r.subject===filter):all.filter(r=>r.lrn===s.lrn);
    const present=recs.filter(r=>r.status!=='absent').length, total=recs.length, rate=total?Math.round(present/total*100):0;
    const standing=total===0?null:rate>=80;
    const rc=rate>=80?'var(--green)':rate>=60?'var(--yellow)':'var(--red)';
    const se=standing===null?'<span style="font-size:11px;color:var(--muted2)">No data</span>':standing?'<span class="badge present">PASSING</span>':'<span class="badge absent">FAILING</span>';
    return '<tr><td style="color:var(--muted2);font-size:12px;width:36px">'+(i+1)+'</td><td>'+nameCell(s.name)+'</td><td class="mono">'+s.lrn+'</td>'+
      '<td style="min-width:160px"><div style="display:flex;align-items:center;gap:10px"><div style="flex:1;background:var(--border);border-radius:6px;height:6px;overflow:hidden"><div style="height:100%;border-radius:6px;background:'+rc+';width:'+(total?rate:0)+'%"></div></div><span style="font-size:12px;font-weight:700;color:'+rc+';min-width:34px;text-align:right">'+(total?rate+'%':'—')+'</span></div></td>'+
      '<td>'+se+'</td></tr>';
  }).join('');
}

function toggleSidebar() {
  const sb   = document.getElementById('t-sidebar');
  const main = document.getElementById('t-main');
  sb.classList.toggle('collapsed');
  main.classList.toggle('shifted');
  localStorage.setItem('sidebar_collapsed', sb.classList.contains('collapsed') ? '1' : '0');
}

function switchTab(id,btn) {
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById(id).classList.add('active'); btn.classList.add('active');
  if(id==='tab-overview') renderOverview();
  if(id==='tab-classes')  renderMyClasses();
}

function openRfidModal() {
  document.getElementById('rfid-modal').style.display='flex';
  const liveSubj=document.getElementById('live-subj-filter')?.value;
  if(liveSubj) document.getElementById('rfid-modal-subject').value=liveSubj;
  setTimeout(()=>document.getElementById('rfid-hidden-input').focus(),150);
}
function closeRfidModal() { document.getElementById('rfid-modal').style.display='none'; rfidResetUI(); }

function rfidKeyHandler(e,input) { if(e.key==='Enter'){ e.preventDefault(); const v=input.value.trim(); input.value=''; if(v) processRfidScan(v); } }
function rfidDemoScan() { processRfidScan(STUDENTS_DB[Math.floor(Math.random()*STUDENTS_DB.length)].lrn); }

function processRfidScan(rfidCode) {
  const subject=document.getElementById('rfid-modal-subject').value;
  const iconEl=document.getElementById('rfid-anim-icon'), statusEl=document.getElementById('rfid-modal-status');
  const subEl=document.getElementById('rfid-modal-sub'), box=document.getElementById('rfid-scanner-box');
  if(!subject){ statusEl.textContent='Select a subject first!'; statusEl.style.color='var(--red)'; subEl.textContent='Choose the subject above before scanning.'; box.style.borderColor='var(--red)'; return; }
  const student=STUDENTS_DB.find(s=>s.lrn===rfidCode);
  const now=new Date(), timeStr=now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  if(!student){ iconEl.style.background='var(--red-light)'; iconEl.innerHTML='<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'; statusEl.textContent='Unknown Card'; statusEl.style.color='var(--red)'; subEl.textContent='RFID '+rfidCode+' is not registered.'; box.style.borderColor='var(--red)'; setTimeout(rfidResetUI,3000); return; }
  const status=now.getHours()*60+now.getMinutes()<=(8*60+15)?'present':'late';
  const all=getAll(), today=now.toISOString().slice(0,10);
  const filtered=all.filter(r=>!(r.lrn===student.lrn&&r.subject===subject&&r.date===today));
  filtered.push({lrn:student.lrn,name:student.name,date:today,subject,timeIn:timeStr,status});
  saveAll(filtered);
  const sc=status==='present'?'var(--green)':'var(--yellow)', sb=status==='present'?'var(--green-light)':'var(--yellow-light)';
  iconEl.style.background=sb; iconEl.innerHTML='<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="'+sc+'" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
  statusEl.textContent=status==='present'?'Marked Present':'Marked Late'; statusEl.style.color=sc;
  subEl.textContent=student.name+' · '+subject+' · '+timeStr; box.style.borderColor=sc;
  const re=document.getElementById('rfid-last-result'); re.style.display='flex';
  document.getElementById('rfid-res-avatar').textContent=initials(student.name);
  document.getElementById('rfid-res-name').textContent=student.name;
  document.getElementById('rfid-res-detail').textContent=student.lrn+' · '+subject;
  const be=document.getElementById('rfid-res-badge'); be.className='badge '+status; be.textContent=status.toUpperCase();
  showToast((status==='present'?'✅':'⏰')+' '+student.name+' — '+status.charAt(0).toUpperCase()+status.slice(1));
  if(document.getElementById('live-tbody')) renderLive();
  setTimeout(rfidResetUI,3500);
}

function rfidResetUI() {
  const i=document.getElementById('rfid-anim-icon'), s=document.getElementById('rfid-modal-status'), su=document.getElementById('rfid-modal-sub'), b=document.getElementById('rfid-scanner-box');
  if(!i) return;
  i.style.background='var(--green-light)'; i.innerHTML='<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M7 15h.01M11 15h2"/></svg>';
  s.textContent='Ready'; s.style.color='var(--text)'; su.textContent='Click here, then swipe / tap RFID card'; b.style.borderColor='var(--border)';
  document.getElementById('rfid-hidden-input')?.focus();
}

function showToast(msg) {
  const t=document.getElementById('toast'); document.getElementById('toast-msg').textContent=msg;
  t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2800);
}

// ── EXPORT CSV ──
function exportCSV() {
  // Grab active filters from records page (safe — returns '' if element not found)
  const dateVal   = document.getElementById('rec-date')?.value   || '';
  const subjVal   = document.getElementById('rec-subj')?.value   || '';
  const stsVal    = document.getElementById('rec-status')?.value || '';
  const searchVal = document.getElementById('rec-search')?.value.toLowerCase() || '';

  let recs = getAll();

  // Apply same filters as renderRecords()
  if (dateVal) {
    const d = new Date(dateVal).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
    recs = recs.filter(r => r.date === d);
  }
  if (subjVal)   recs = recs.filter(r => r.subject === subjVal);
  if (stsVal)    recs = recs.filter(r => r.status  === stsVal.toLowerCase());
  if (searchVal) recs = recs.filter(r =>
    r.name.toLowerCase().includes(searchVal) || r.lrn.includes(searchVal)
  );

  if (!recs.length) {
    showToast('⚠️ No records to export');
    return;
  }

  // Build CSV
  const headers = ['Student Name','Student ID','Date','Subject','Time In','Status'];
  const rows = recs.map(r => [
    `"${r.name}"`,
    r.lrn,
    `"${r.date}"`,
    `"${r.subject}"`,
    r.timeIn,
    r.status
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  // Trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `passpoint_records_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`📤 Exported ${recs.length} record${recs.length !== 1 ? 's' : ''}`);
}