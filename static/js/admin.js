const LS_KEY='passpoint_v2',LS_TEACHERS='passpoint_teachers',LS_STUDENTS='passpoint_students',LS_RFID='passpoint_rfid';
const CLASSES=['Data Structures','Web Development','Database Systems','Software Engineering','Cybersecurity'];
const DEFAULT_STUDENTS=[
  {name:'Geo Sumanga',lrn:'123456789001',rfid:'A1B2C3D4',section:'BSIT 2-12',status:'active'},
  {name:'Ana Reyes',lrn:'123456789002',rfid:'E5F6G7H8',section:'BSIT 2-12',status:'active'},
  {name:'Marco Cruz',lrn:'123456789003',rfid:'I9J0K1L2',section:'BSIT 2-12',status:'active'},
  {name:'Lena Santos',lrn:'123456789004',rfid:'M3N4O5P6',section:'BSIT 2-12',status:'active'},
  {name:'Ryan Tan',lrn:'123456789005',rfid:'Q7R8S9T0',section:'BSIT 2-12',status:'active'},
  {name:'Maria Flores',lrn:'123456789006',rfid:'U1V2W3X4',section:'BSIT 2-12',status:'active'},
  {name:'Jed Ocampo',lrn:'123456789007',rfid:'Y5Z6A7B8',section:'BSIT 2-12',status:'active'},
  {name:'Carla Dizon',lrn:'123456789008',rfid:'C9D0E1F2',section:'BSIT 2-12',status:'active'},
  {name:'Ben Lim',lrn:'123456789009',rfid:'G3H4I5J6',section:'BSIT 2-12',status:'active'},
  {name:'Grace Mendoza',lrn:'123456789010',rfid:'K7L8M9N0',section:'BSIT 2-12',status:'active'},
];
const DEFAULT_TEACHERS=[
  {name:'Reuben Mallorca',empId:'EMP-2024-001',subject:'Data Structures',room:'PH 406',days:'Mon Wed Fri',status:'active'},
  {name:'Maria Santos',empId:'EMP-2024-002',subject:'Web Development',room:'PH 402',days:'Mon Wed Fri',status:'active'},
  {name:'Jose Reyes',empId:'EMP-2024-003',subject:'Database Systems',room:'PH 405',days:'Tue Thu',status:'active'},
  {name:'Ana Cruz',empId:'EMP-2024-004',subject:'Software Engineering',room:'PH 408',days:'Tue Thu',status:'active'},
  {name:'Mark Lim',empId:'EMP-2024-005',subject:'Cybersecurity',room:'PH 410',days:'Mon Wed',status:'active'},
];

// ── DATA HELPERS ──
function getAll(){try{return JSON.parse(localStorage.getItem(LS_KEY)||'[]');}catch{return[];}}
function saveAll(a){localStorage.setItem(LS_KEY,JSON.stringify(a));}
function getStudents(){try{return JSON.parse(localStorage.getItem(LS_STUDENTS)||'null')||DEFAULT_STUDENTS;}catch{return DEFAULT_STUDENTS;}}
function saveStudents(a){localStorage.setItem(LS_STUDENTS,JSON.stringify(a));}
function getTeachers(){try{return JSON.parse(localStorage.getItem(LS_TEACHERS)||'null')||DEFAULT_TEACHERS;}catch{return DEFAULT_TEACHERS;}}
function saveTeachers(a){localStorage.setItem(LS_TEACHERS,JSON.stringify(a));}
function getRFID(){try{return JSON.parse(localStorage.getItem(LS_RFID)||'null')||DEFAULT_STUDENTS.map(s=>({tag:s.rfid,lrn:s.lrn,name:s.name,status:'assigned'})).concat([{tag:'SPARE001',lrn:'',name:'',status:'unassigned'}]);}catch{return[];}}
function saveRFID(a){localStorage.setItem(LS_RFID,JSON.stringify(a));}
function todayStr(){return new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});}
function initials(n){return n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();}
function badgeEl(cls,lbl){return `<span class="badge ${cls}">${(lbl||cls).toUpperCase()}</span>`;}
function nameCell(name,sub){return `<div style="display:flex;align-items:center;gap:9px"><div style="width:28px;height:28px;border-radius:50%;background:var(--green);color:white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0">${initials(name)}</div><div><div style="font-weight:600;font-size:13px">${name}</div>${sub?`<div style="font-size:11px;color:var(--muted)">${sub}</div>`:''}</div></div>`;}

function subjectBars(id){
  const all=getAll(),el=document.getElementById(id);if(!el)return;
  el.innerHTML=CLASSES.map((c,i)=>{
    const r=all.filter(x=>x.subject===c),pct=r.length?Math.round(r.filter(x=>x.status!=='absent').length/r.length*100):0;
    const cls=pct>=80?'good':pct>=60?'risk':'low',lbl=pct>=80?'Good':pct>=60?'Risk':'Low';
    return `<div class="subject-row"${i===CLASSES.length-1?' style="margin-bottom:0"':''}><div class="subject-header"><span class="subject-name">${c}</span><div><span class="subject-pct">${pct}%</span><span class="subject-status ${cls}">${lbl}</span></div></div><div class="bar-track"><div class="bar-fill ${cls}" data-w="${pct}"></div></div></div>`;
  }).join('');
  setTimeout(()=>el.querySelectorAll('.bar-fill').forEach(b=>b.style.width=b.dataset.w+'%'),80);
}

// ── BOOT ──
window.onload=()=>{
  // Inject demo record
  const all=getAll(),today=todayStr();
  if(!all.some(r=>r.lrn==='123456789001'&&r.date===today&&r.subject==='Web Development')){
    all.push({lrn:'123456789001',name:'Geo Sumanga',date:today,subject:'Web Development',room:'PH 402',timeIn:'9:03 AM',status:'present',notes:''});
    saveAll(all);
  }
  // Run page-specific render
  if(document.getElementById('d-rate'))        renderDashboard();
  if(document.getElementById('att-body'))      renderAttendance();
  if(document.getElementById('rec-body'))      renderRecords();
  if(document.getElementById('teachers-body')) renderTeachers();
  if(document.getElementById('students-body')) renderStudents();
  if(document.getElementById('rfid-body'))     { renderRFID(); populateStudentSelect(); }
  if(document.getElementById('rp-rate'))       renderReports();

  // Auto-refresh attendance and dashboard
  setInterval(()=>{
    if(document.getElementById('att-body'))renderAttendance();
    if(document.getElementById('d-rate'))renderDashboard();
  },5000);

  // Restore sidebar state
  restoreSidebar();
};

// ── SIDEBAR ──
function toggleSidebar() {
  const sb  = document.getElementById('a-sidebar');
  const m   = document.getElementById('a-main');
  sb.classList.toggle('collapsed');
  m.classList.toggle('shifted');
  localStorage.setItem('sidebar_collapsed', sb.classList.contains('collapsed') ? '1' : '0');
}

function restoreSidebar() { /* handled by inline script in <head> */ }

// ── DASHBOARD ──
function renderDashboard(){
  const all=getAll(),students=getStudents(),teachers=getTeachers(),today=all.filter(r=>r.date===todayStr());
  const present=today.filter(r=>r.status!=='absent').length,rate=today.length?Math.round(present/today.length*100):0;
  const flagged=students.filter(s=>{const r=all.filter(x=>x.lrn===s.lrn);return r.length&&Math.round(r.filter(x=>x.status!=='absent').length/r.length*100)<80;}).length;
  document.getElementById('d-rate').textContent=rate+'%';
  document.getElementById('d-total-students').textContent=students.length;
  document.getElementById('d-total-teachers').textContent=teachers.length;
  document.getElementById('d-flagged').textContent=flagged;
  document.getElementById('d-today-lbl').textContent=new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
  document.getElementById('a-dash-sub').textContent=new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})+' · PassPoint RFID System';
  const recent=[...today].reverse().slice(0,6);
  document.getElementById('d-scans-body').innerHTML=recent.length?recent.map(r=>`<tr><td>${nameCell(r.name)}</td><td class="mono">${r.timeIn}</td><td style="font-size:12px">${r.subject}</td><td>${badgeEl(r.status)}</td></tr>`).join(''):`<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:16px">No scans today</td></tr>`;
  subjectBars('d-subj-bars');
  const ranked=students.map(s=>{const r=all.filter(x=>x.lrn===s.lrn);return{...s,rate:r.length?Math.round(r.filter(x=>x.status!=='absent').length/r.length*100):0};}).filter(s=>all.some(x=>x.lrn===s.lrn)).sort((a,b)=>b.rate-a.rate);
  document.getElementById('d-top-body').innerHTML=ranked.slice(0,5).length?ranked.slice(0,5).map((s,i)=>`<tr><td style="color:var(--muted2);font-size:12px;width:28px">${i+1}</td><td>${nameCell(s.name)}</td><td style="font-weight:700;color:var(--green)">${s.rate}%</td></tr>`).join(''):`<tr><td colspan="3" style="text-align:center;color:var(--muted);padding:14px">No data yet</td></tr>`;
  const lows=ranked.filter(s=>s.rate<80).reverse().slice(0,5);
  document.getElementById('d-low-body').innerHTML=lows.length?lows.map(s=>{const absent=all.filter(x=>x.lrn===s.lrn&&x.status==='absent').length;return`<tr><td>${nameCell(s.name)}</td><td style="font-weight:700;color:var(--red)">${s.rate}%</td><td style="color:var(--red)">${absent}</td></tr>`;}).join(''):`<tr><td colspan="3" style="text-align:center;color:var(--green);padding:14px">✅ All above 80%</td></tr>`;
}

// ── ATTENDANCE ──
function renderAttendance(){
  const subj=document.getElementById('att-subj')?.value||'',status=document.getElementById('att-status')?.value||'',q=document.getElementById('att-search')?.value.toLowerCase()||'';
  let recs=getAll().filter(r=>r.date===todayStr());
  if(subj)recs=recs.filter(r=>r.subject===subj);
  if(status)recs=recs.filter(r=>r.status===status.toLowerCase());
  if(q)recs=recs.filter(r=>r.name.toLowerCase().includes(q)||r.lrn.includes(q));
  document.getElementById('att-date-lbl').textContent=new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
  document.getElementById('att-count').textContent=recs.length+' scan'+(recs.length!==1?'s':'');
  document.getElementById('att-body').innerHTML=recs.length?[...recs].reverse().map(r=>`<tr><td>${nameCell(r.name)}</td><td class="mono">${r.lrn}</td><td class="mono">${r.timeIn}</td><td style="font-size:12px">${r.subject}</td><td>${badgeEl(r.status)}</td><td><button class="btn btn-outline btn-sm" onclick="openEditModal('${r.lrn}','${r.subject}','${r.date}','${r.status}')">Edit</button></td></tr>`).join(''):`<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:20px">No records match your filters</td></tr>`;
}

// ── ALL RECORDS ──
function renderRecords(){
  let recs=getAll();
  const date=document.getElementById('rec-date')?.value,subj=document.getElementById('rec-subj')?.value||'',status=document.getElementById('rec-status')?.value||'',q=document.getElementById('rec-search')?.value.toLowerCase()||'';
  if(date){const d=new Date(date).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});recs=recs.filter(r=>r.date===d);}
  if(subj)recs=recs.filter(r=>r.subject===subj);
  if(status)recs=recs.filter(r=>r.status===status.toLowerCase());
  if(q)recs=recs.filter(r=>r.name.toLowerCase().includes(q)||r.lrn.includes(q));
  document.getElementById('rec-count').textContent=recs.length+' records';
  document.getElementById('rec-body').innerHTML=recs.length?[...recs].reverse().slice(0,60).map(r=>`<tr><td>${nameCell(r.name)}</td><td class="mono">${r.lrn}</td><td style="font-size:12px;color:var(--muted)">${r.date}</td><td style="font-size:12px">${r.subject}</td><td class="mono">${r.timeIn}</td><td>${badgeEl(r.status)}</td></tr>`).join(''):`<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:20px">No records found</td></tr>`;
}

// ── TEACHERS ──
function renderTeachers(filter=''){
  const list=getTeachers().filter(t=>!filter||t.name.toLowerCase().includes(filter.toLowerCase())||t.empId.toLowerCase().includes(filter.toLowerCase()));
  document.getElementById('teachers-body').innerHTML=list.length?list.map((t,i)=>`<tr><td>${nameCell(t.name)}</td><td class="mono">${t.empId}</td><td style="font-size:12px">${t.subject}</td><td style="font-size:12px;color:var(--muted)">${t.room}</td><td style="font-size:12px;color:var(--muted)">${t.days||'—'}</td><td>${badgeEl(t.status)}</td><td style="display:flex;gap:6px"><button class="btn btn-outline btn-sm" onclick="showToast('✏️ Edit coming soon')">Edit</button><button class="btn btn-red btn-sm" onclick="removeTeacher(${i})">Remove</button></td></tr>`).join(''):`<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:20px">No teachers found</td></tr>`;
}
function addTeacher(){
  const name=document.getElementById('t-name').value.trim(),empId=document.getElementById('t-empid').value.trim(),subject=document.getElementById('t-subject').value,room=document.getElementById('t-room').value.trim(),days=document.getElementById('t-days').value.trim();
  if(!name||!empId){showToast('❌ Name and Employee ID required');return;}
  const all=getTeachers();all.push({name,empId,subject,room:room||'TBA',days:days||'TBA',status:'active'});saveTeachers(all);
  closeModal('teacher');renderTeachers();renderDashboard();showToast('✅ Teacher added: '+name);
  ['t-name','t-empid','t-room','t-days'].forEach(id=>document.getElementById(id).value='');
}
function removeTeacher(i){if(!confirm('Remove this teacher?'))return;const a=getTeachers();a.splice(i,1);saveTeachers(a);renderTeachers();renderDashboard();showToast('🗑 Teacher removed');}

// ── STUDENTS ──
function renderStudents(filter=''){
  const all=getAll(),list=getStudents().filter(s=>!filter||s.name.toLowerCase().includes(filter.toLowerCase())||s.lrn.includes(filter));
  document.getElementById('students-body').innerHTML=list.length?list.map((s,i)=>{
    const recs=all.filter(r=>r.lrn===s.lrn),present=recs.filter(r=>r.status!=='absent').length,absent=recs.filter(r=>r.status==='absent').length,rate=recs.length?Math.round(present/recs.length*100):0,rc=rate>=80?'var(--green)':rate>=60?'var(--yellow)':'var(--red)';
    return`<tr><td>${nameCell(s.name)}</td><td class="mono">${s.lrn}</td><td><span style="font-family:monospace;font-size:11px;background:var(--bg);border:1px solid var(--border);padding:2px 8px;border-radius:4px">${s.rfid||'—'}</span></td><td style="font-size:12px;color:var(--muted)">${s.section}</td><td style="color:var(--green);font-weight:600">${present}</td><td style="color:var(--red);font-weight:600">${absent}</td><td style="font-weight:700;color:${rc}">${recs.length?rate+'%':'—'}</td><td>${badgeEl(s.status)}</td><td style="display:flex;gap:6px"><button class="btn btn-outline btn-sm" onclick="showToast('✏️ Edit coming soon')">Edit</button><button class="btn btn-red btn-sm" onclick="removeStudent(${i})">Remove</button></td></tr>`;
  }).join(''):`<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:20px">No students found</td></tr>`;
}
function addStudent(){
  const name=document.getElementById('s-name').value.trim(),lrn=document.getElementById('s-lrn').value.trim(),section=document.getElementById('s-section').value.trim(),rfid=document.getElementById('s-rfid').value.trim();
  if(!name||!lrn){showToast('❌ Name and Student ID required');return;}
  const students=getStudents();if(students.find(s=>s.lrn===lrn)){showToast('❌ Student ID already exists');return;}
  students.push({name,lrn,rfid:rfid||'UNASSIGNED',section:section||'BSIT',status:'active'});saveStudents(students);
  if(rfid){const tags=getRFID();if(!tags.find(t=>t.tag===rfid)){tags.push({tag:rfid,lrn,name,status:'assigned'});saveRFID(tags);}}
  closeModal('student');renderStudents();renderDashboard();showToast('✅ Student enrolled: '+name);
  ['s-name','s-lrn','s-rfid'].forEach(id=>document.getElementById(id).value='');
}
function removeStudent(i){if(!confirm('Remove this student?'))return;const s=getStudents();s.splice(i,1);saveStudents(s);renderStudents();renderDashboard();showToast('🗑 Student removed');}

// ── RFID ──
function renderRFID(filter=''){
  const all=getAll(),tags=getRFID(),list=tags.filter(t=>!filter||t.tag.toLowerCase().includes(filter.toLowerCase())||t.name.toLowerCase().includes(filter.toLowerCase()));
  const assigned=tags.filter(t=>t.status==='assigned').length;
  document.getElementById('rfid-total').textContent=tags.length;
  document.getElementById('rfid-assigned').textContent=assigned;
  document.getElementById('rfid-free').textContent=tags.length-assigned;
  document.getElementById('rfid-body').innerHTML=list.length?list.map((t,i)=>{
    const scans=all.filter(r=>r.lrn===t.lrn),last=scans.length?[...scans].reverse()[0]:null;
    return`<tr><td><span style="font-family:monospace;font-size:12px;font-weight:700;background:var(--bg);border:1px solid var(--border);padding:3px 9px;border-radius:5px">${t.tag}</span></td><td>${t.name?nameCell(t.name):'<span style="color:var(--muted2);font-size:12px">Unassigned</span>'}</td><td class="mono">${t.lrn||'—'}</td><td style="font-size:12px;color:var(--muted)">${last?last.date+' '+last.timeIn:'Never'}</td><td style="font-weight:600">${scans.length}</td><td>${badgeEl(t.status)}</td><td style="display:flex;gap:6px"><button class="btn btn-outline btn-sm" onclick="showToast('✏️ Reassign coming soon')">Reassign</button><button class="btn btn-red btn-sm" onclick="removeRFID(${i})">Remove</button></td></tr>`;
  }).join(''):`<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:20px">No RFID tags found</td></tr>`;
}
function addRFID(){
  const tag=document.getElementById('r-tag').value.trim(),lrnVal=document.getElementById('r-student').value;
  if(!tag){showToast('❌ RFID tag ID is required');return;}
  const tags=getRFID();if(tags.find(t=>t.tag===tag)){showToast('❌ Tag already registered');return;}
  const student=getStudents().find(s=>s.lrn===lrnVal);
  tags.push({tag,lrn:lrnVal||'',name:student?.name||'',status:lrnVal?'assigned':'unassigned'});saveRFID(tags);
  closeModal('rfid');renderRFID();showToast('✅ RFID tag registered: '+tag);
  document.getElementById('r-tag').value='';
}
function removeRFID(i){if(!confirm('Remove this RFID tag?'))return;const t=getRFID();t.splice(i,1);saveRFID(t);renderRFID();showToast('🗑 Tag removed');}
function populateStudentSelect(){const sel=document.getElementById('r-student');if(!sel)return;sel.innerHTML='<option value="">— Unassigned —</option>'+getStudents().map(s=>`<option value="${s.lrn}">${s.name} (${s.lrn})</option>`).join('');}

// ── REPORTS ──
function renderReports(){
  const all=getAll(),students=getStudents(),present=all.filter(r=>r.status!=='absent').length,overall=all.length?Math.round(present/all.length*100):0;
  const flaggedList=students.filter(s=>{const r=all.filter(x=>x.lrn===s.lrn);return r.length&&Math.round(r.filter(x=>x.status!=='absent').length/r.length*100)<80;});
  const perfect=students.filter(s=>{const r=all.filter(x=>x.lrn===s.lrn);return r.length&&r.every(x=>x.status!=='absent');}).length;
  document.getElementById('rp-rate').textContent=overall+'%';
  document.getElementById('rp-scans').textContent=all.length;
  document.getElementById('rp-flagged').textContent=flaggedList.length;
  document.getElementById('rp-perfect').textContent=perfect;
  subjectBars('rp-subj-bars');
  document.getElementById('rp-flagged-body').innerHTML=flaggedList.length?flaggedList.map(s=>{
    const recs=all.filter(x=>x.lrn===s.lrn),absent=recs.filter(x=>x.status==='absent').length,rate=Math.round(recs.filter(x=>x.status!=='absent').length/recs.length*100);
    return`<tr><td>${nameCell(s.name)}</td><td class="mono">${s.lrn}</td><td style="font-weight:700;color:var(--red)">${rate}%</td><td style="color:var(--red)">${absent} days</td><td><button class="btn btn-outline btn-sm" onclick="showToast('📮 Notification sent for ${s.name}')">Notify</button></td></tr>`;
  }).join(''):`<tr><td colspan="5" style="text-align:center;color:var(--green);padding:20px">✅ All students are above 80%</td></tr>`;
}

// ── EDIT STATUS MODAL ──
let _editCtx=null;
function openEditModal(lrn,subj,date,currentStatus){
  _editCtx={lrn,subj,date};
  const s=getStudents().find(s=>s.lrn===lrn);
  document.getElementById('edit-lbl').textContent=`${s?.name||lrn}  ·  ${subj}  ·  ${date}`;
  document.querySelectorAll('.modal-status-btn').forEach(btn=>{const cur=btn.dataset.status===currentStatus;btn.style.borderColor=cur?'var(--green)':'var(--border)';btn.style.background=cur?'var(--green-hover)':'white';});
  openModal('edit');
}
function applyStatus(newStatus){
  if(!_editCtx)return;
  const all=getAll(),idx=all.findIndex(r=>r.lrn===_editCtx.lrn&&r.subject===_editCtx.subj&&r.date===_editCtx.date);
  if(idx>-1){all[idx].status=newStatus;saveAll(all);}
  if(document.getElementById('att-body'))renderAttendance();
  if(document.getElementById('d-rate'))renderDashboard();
  showToast('✅ Status updated to '+newStatus);closeModal('edit');_editCtx=null;
}

// ── EXPORT CSV ──
function exportCSV(){
  let recs=getAll();
  const date=document.getElementById('rec-date')?.value,subj=document.getElementById('rec-subj')?.value||'',status=document.getElementById('rec-status')?.value||'',q=document.getElementById('rec-search')?.value.toLowerCase()||'';
  if(date){const d=new Date(date).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});recs=recs.filter(r=>r.date===d);}
  if(subj)recs=recs.filter(r=>r.subject===subj);
  if(status)recs=recs.filter(r=>r.status===status.toLowerCase());
  if(q)recs=recs.filter(r=>r.name.toLowerCase().includes(q)||r.lrn.includes(q));
  if(!recs.length){showToast('⚠️ No records to export');return;}
  const rows=['Name,Student ID,Date,Subject,Time In,Status',...recs.map(r=>`"${r.name}","${r.lrn}","${r.date}","${r.subject}","${r.timeIn}","${r.status}"`)];
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([rows.join('\n')],{type:'text/csv'}));
  a.download=`passpoint_records_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  showToast(`📤 Exported ${recs.length} records`);
}

// ── MODAL HELPERS ──
function openModal(id){document.getElementById('modal-'+id).classList.add('open');if(id==='rfid')populateStudentSelect();}
function closeModal(id){document.getElementById('modal-'+id).classList.remove('open');}
function showToast(msg){const t=document.getElementById('toast');document.getElementById('toast-msg').textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2800);}