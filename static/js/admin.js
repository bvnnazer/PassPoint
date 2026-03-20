// ═══════════════════════════════════════════
//  PASSPOINT — Admin Portal JS
//  All data from real Flask/MySQL API
// ═══════════════════════════════════════════

const CLASSES = ['Data Structures','Web Development','Database Systems','Software Engineering','Cybersecurity'];

function todayStr() { return new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}); }
function initials(n) { return n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(); }
function badgeEl(cls,lbl) { return `<span class="badge ${cls}">${(lbl||cls).toUpperCase()}</span>`; }
function nameCell(name, sub) {
  return `<div style="display:flex;align-items:center;gap:9px">
    <div style="width:28px;height:28px;border-radius:50%;background:var(--green);color:white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0">${initials(name)}</div>
    <div><div style="font-weight:600;font-size:13px">${name}</div>${sub?`<div style="font-size:11px;color:var(--muted)">${sub}</div>`:''}</div>
  </div>`;
}

function subjectBarsFromData(id, subjects) {
  const el = document.getElementById(id); if (!el) return;
  el.innerHTML = CLASSES.map((c, i) => {
    const row = subjects.find(s => s.subject === c);
    const pct = row ? row.pct : 0;
    const cls = pct >= 80 ? 'good' : pct >= 60 ? 'risk' : 'low';
    const lbl = pct === 0 ? 'No Data' : cls === 'good' ? 'Good' : cls === 'risk' ? 'Risk' : 'Low';
    return `<div class="subject-row"${i===CLASSES.length-1?' style="margin-bottom:0"':''}>
      <div class="subject-header"><span class="subject-name">${c}</span>
      <div><span class="subject-pct">${pct}%</span><span class="subject-status ${cls}">${lbl}</span></div></div>
      <div class="bar-track"><div class="bar-fill ${cls}" data-w="${pct}" style="width:0%"></div></div>
    </div>`;
  }).join('');
  setTimeout(() => el.querySelectorAll('.bar-fill').forEach(b => b.style.width = b.dataset.w + '%'), 80);
}

// ── BOOT ──
window.onload = () => {
  if (document.getElementById('d-rate'))        renderDashboard();
  if (document.getElementById('att-body'))      renderAttendance();
  if (document.getElementById('rec-body'))      renderRecords();
  if (document.getElementById('teachers-body')) renderTeachers();
  if (document.getElementById('students-body')) renderStudents();
  if (document.getElementById('rfid-body'))     renderRFID();
  if (document.getElementById('rp-rate'))       renderReports();

  setInterval(() => {
    if (document.getElementById('att-body')) renderAttendance();
    if (document.getElementById('d-rate'))   renderDashboard();
  }, 5000);

  restoreSidebar();
};

// ── SIDEBAR ──
function toggleSidebar() {
  const sb = document.getElementById('a-sidebar');
  const m  = document.getElementById('a-main');
  sb.classList.toggle('collapsed');
  m.classList.toggle('shifted');
  localStorage.setItem('sidebar_collapsed', sb.classList.contains('collapsed') ? '1' : '0');
}
function restoreSidebar() { /* handled by inline <head> script */ }

// ── DASHBOARD ──
function renderDashboard() {
  fetch('/api/admin/dashboard')
    .then(r => r.json())
    .then(d => {
      document.getElementById('d-rate').textContent           = (d.rate || 0) + '%';
      document.getElementById('d-total-students').textContent = d.total_students || 0;
      document.getElementById('d-total-teachers').textContent = d.total_teachers || 0;
      document.getElementById('d-flagged').textContent        = d.flagged || 0;
      document.getElementById('d-today-lbl').textContent      = new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
      document.getElementById('a-dash-sub').textContent       = new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}) + ' · PassPoint RFID System';

      // Today's scans
      const scansEl = document.getElementById('d-scans-body');
      if (d.scans && d.scans.length) {
        scansEl.innerHTML = d.scans.slice(0, 8).map(r =>
          `<tr><td>${nameCell(r.name)}</td><td class="mono">${r.scanned_at}</td><td style="font-size:12px">${r.subject}</td><td>${badgeEl(r.status)}</td></tr>`
        ).join('');
      } else {
        scansEl.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:20px;">No scans today</td></tr>`;
      }

      subjectBarsFromData('d-subj-bars', d.subjects || []);

      // Top attendees
      const topEl = document.getElementById('d-top-body');
      if (topEl) {
        topEl.innerHTML = (d.top && d.top.length)
          ? d.top.map((s, i) => `<tr><td style="color:var(--muted2);font-size:12px;width:28px">${i+1}</td><td>${nameCell(s.name)}</td><td style="font-weight:700;color:var(--green)">${s.rate}%</td></tr>`).join('')
          : `<tr><td colspan="3" style="text-align:center;color:var(--muted);padding:20px;">No data yet</td></tr>`;
      }

      // Needs attention
      const lowEl = document.getElementById('d-low-body');
      if (lowEl) {
        lowEl.innerHTML = (d.low && d.low.length)
          ? d.low.map(s => `<tr><td>${nameCell(s.name)}</td><td style="font-weight:700;color:var(--red)">${s.rate}%</td><td style="color:var(--red)">${s.absent}</td></tr>`).join('')
          : `<tr><td colspan="3" style="text-align:center;color:var(--green);padding:20px;font-size:13px;font-weight:500;">No students are currently below 80% attendance.</td></tr>`;
      }
    })
    .catch(() => {});
}

// ── ATTENDANCE ──
function renderAttendance() {
  const subj   = document.getElementById('att-subj')?.value   || '';
  const status = document.getElementById('att-status')?.value || '';
  const q      = document.getElementById('att-search')?.value || '';
  const params = new URLSearchParams({ subject: subj, status, q });

  fetch('/api/admin/attendance?' + params)
    .then(r => r.json())
    .then(recs => {
      document.getElementById('att-date-lbl').textContent = new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
      document.getElementById('att-count').textContent    = recs.length + ' scan' + (recs.length!==1?'s':'');
      document.getElementById('att-body').innerHTML = recs.length
        ? recs.map(r => `<tr>
            <td>${nameCell(r.name)}</td>
            <td style="font-family:monospace;font-size:11px;color:var(--muted);text-align:center">${r.rfid_uid||'—'}</td>
            <td style="font-family:monospace;font-size:12px;text-align:center">${r.time_in}</td>
            <td style="font-size:12px;text-align:center">${r.subject}</td>
            <td style="text-align:center">${badgeEl(r.status)}</td>
            <td style="text-align:center"><button class="action-btn edit-btn" onclick="openEditModal(${r.id},'${r.name}','${r.subject}','${r.status}')">Edit</button></td>
          </tr>`).join('')
        : `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:20px">No records match your filters</td></tr>`;
    });
}

// ── ALL RECORDS ──
function renderRecords() {
  const date   = document.getElementById('rec-date')?.value   || '';
  const subj   = document.getElementById('rec-subj')?.value   || '';
  const status = document.getElementById('rec-status')?.value || '';
  const q      = document.getElementById('rec-search')?.value || '';
  const params = new URLSearchParams({ date, subject: subj, status, q });

  fetch('/api/admin/records?' + params)
    .then(r => r.json())
    .then(recs => {
      document.getElementById('rec-count').textContent = recs.length + ' records';
      document.getElementById('rec-body').innerHTML = recs.length
        ? recs.map(r => `<tr>
            <td>${nameCell(r.name)}</td>
            <td style="font-family:monospace;font-size:11px;color:var(--muted);text-align:center">${r.rfid_uid||'—'}</td>
            <td style="font-size:12px;color:var(--muted);text-align:center">${r.date}</td>
            <td style="font-size:12px;text-align:center">${r.subject}</td>
            <td style="font-family:monospace;font-size:12px;text-align:center">${r.time_in}</td>
            <td style="text-align:center">${badgeEl(r.status)}</td>
          </tr>`).join('')
        : `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:20px">No records found</td></tr>`;
    });
}

function exportCSV() {
  const date   = document.getElementById('rec-date')?.value   || '';
  const subj   = document.getElementById('rec-subj')?.value   || '';
  const status = document.getElementById('rec-status')?.value || '';
  const q      = document.getElementById('rec-search')?.value || '';
  const params = new URLSearchParams({ date, subject: subj, status, q });

  fetch('/api/admin/records?' + params)
    .then(r => r.json())
    .then(recs => {
      if (!recs.length) { showToast('⚠️ No records to export'); return; }
      const rows = ['Name,RFID,Date,Subject,Time In,Status',
        ...recs.map(r => `"${r.name}","${r.rfid_uid||''}","${r.date}","${r.subject}","${r.time_in}","${r.status}"`)];
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([rows.join('\n')], {type:'text/csv'}));
      a.download = `passpoint_records_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      showToast(`📤 Exported ${recs.length} records`);
    });
}

// ── TEACHERS ──
function renderTeachers(filter) {
  fetch('/api/admin/teachers')
    .then(r => r.json())
    .then(list => {
      const q = (filter || '').toLowerCase();
      const filtered = q ? list.filter(t => (t.first_name+' '+t.last_name).toLowerCase().includes(q)) : list;
      document.getElementById('teachers-body').innerHTML = filtered.length
        ? filtered.map((t, i) => `<tr>
            <td>${nameCell(t.first_name+' '+t.last_name)}</td>
            <td style="font-size:12px;color:var(--muted)">${t.email||'—'}</td>
            <td style="font-size:12px">${t.subject||'—'}</td>
            <td style="font-size:12px;color:var(--muted);text-align:center">${t.room||'—'}</td>
            <td style="font-size:12px;color:var(--muted);text-align:center">${t.days||'—'}</td>
            <td style="text-align:center">${badgeEl('active')}</td>
            <td style="text-align:right">
              <div style="display:inline-flex;gap:5px;justify-content:flex-end;">
                <button class="action-btn edit-btn" onclick="showToast('Edit coming soon')">Edit</button>
                <button class="action-btn remove-btn" onclick="removeTeacher(${t.id})">Remove</button>
              </div>
            </td>
          </tr>`).join('')
        : `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:20px">No teachers found</td></tr>`;
    });
}

function addTeacher() {
  const first = document.getElementById('t-name').value.trim().split(' ')[0] || '';
  const last  = document.getElementById('t-name').value.trim().split(' ').slice(1).join(' ') || '';
  const empid = document.getElementById('t-empid').value.trim();
  const email = empid + '@passpoint.edu';
  if (!first) { showToast('❌ Name is required'); return; }
  fetch('/api/admin/teachers', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ first_name: first, last_name: last || first, email })
  })
  .then(r => r.json())
  .then(d => {
    if (d.error) { showToast('❌ ' + d.error); return; }
    closeModal('teacher'); renderTeachers();
    showToast('✅ Teacher added');
    document.getElementById('t-name').value = '';
    document.getElementById('t-empid').value = '';
  });
}

function removeTeacher(id) {
  if (!confirm('Remove this teacher?')) return;
  fetch('/api/admin/teachers/' + id, { method: 'DELETE' })
    .then(() => { renderTeachers(); showToast('🗑 Teacher removed'); })
    .catch(() => showToast('⚠️ Could not remove teacher'));
}

// ── STUDENTS ──
function renderStudents(filter) {
  fetch('/api/admin/students')
    .then(r => r.json())
    .then(list => {
      const q = (filter || '').toLowerCase();
      const filtered = q ? list.filter(s =>
        (s.first_name+' '+s.last_name).toLowerCase().includes(q) ||
        (s.rfid_uid||'').toLowerCase().includes(q)
      ) : list;
      document.getElementById('students-body').innerHTML = filtered.length
        ? filtered.map(s => {
            const present = parseInt(s.present_count||0) + parseInt(s.late_count||0);
            const absent  = parseInt(s.absent_count||0);
            const rate    = s.rate || 0;
            const rc = rate>=80?'var(--green)':rate>=60?'var(--yellow)':'var(--red)';
            return `<tr>
              <td>${nameCell(s.first_name+' '+s.last_name)}</td>
              <td class="mono" style="font-size:12px">${s.email||'—'}</td>
              <td><span style="font-family:monospace;font-size:11px;background:var(--bg);border:1px solid var(--border);padding:2px 8px;border-radius:4px">${s.rfid_uid||'—'}</span></td>
              <td style="font-size:12px;color:var(--muted);text-align:center">BSIT</td>
              <td style="color:var(--green);font-weight:600;text-align:center">${present}</td>
              <td style="color:var(--red);font-weight:600;text-align:center">${absent}</td>
              <td style="font-weight:700;color:${rc};text-align:center">${rate}%</td>
              <td style="text-align:center">${badgeEl('active')}</td>
              <td>
                <div style="display:flex;gap:6px;align-items:center;justify-content:center;">
                  <button class="btn btn-outline btn-sm" onclick="showToast('✏️ Edit coming soon')" title="Edit" style="display:flex;align-items:center;gap:4px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit
                  </button>
                  <button class="btn btn-red btn-sm" onclick="removeStudent(${s.id})" title="Remove" style="display:flex;align-items:center;gap:4px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    Remove
                  </button>
                </div>
              </td>
            </tr>`;
          }).join('')
        : `<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:20px">No students found</td></tr>`;
    });
}

function addStudent() {
  const name    = document.getElementById('s-name').value.trim();
  const lrn     = document.getElementById('s-lrn').value.trim();
  const section = document.getElementById('s-section').value.trim();
  const rfid    = document.getElementById('s-rfid').value.trim();
  if (!name || !lrn) { showToast('❌ Name and Student ID required'); return; }
  const parts = name.split(' ');
  const first = parts[0], last = parts.slice(1).join(' ') || parts[0];
  fetch('/api/students', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ first_name: first, last_name: last, email: lrn+'@student.edu', rfid_uid: rfid })
  })
  .then(r => r.json())
  .then(d => {
    if (d.error) { showToast('❌ ' + d.error); return; }
    closeModal('student'); renderStudents(); renderDashboard();
    showToast('✅ Student enrolled: ' + name);
    ['s-name','s-lrn','s-rfid'].forEach(id => document.getElementById(id).value = '');
  });
}

function removeStudent(id) {
  if (!confirm('Remove this student?')) return;
  fetch('/api/admin/students/' + id, { method: 'DELETE' })
    .then(() => { renderStudents(); renderDashboard(); showToast('🗑 Student removed'); })
    .catch(() => showToast('⚠️ Could not remove student'));
}

// ── RFID TAGS ──
function renderRFID(filter) {
  fetch('/api/admin/rfidtags')
    .then(r => r.json())
    .then(tags => {
      const q = (filter || '').toLowerCase();
      const list = q ? tags.filter(t => (t.rfid_uid||'').toLowerCase().includes(q) || t.name.toLowerCase().includes(q)) : tags;
      document.getElementById('rfid-total').textContent    = tags.length;
      document.getElementById('rfid-assigned').textContent = tags.filter(t => t.rfid_uid).length;
      document.getElementById('rfid-free').textContent     = 0;
      document.getElementById('rfid-body').innerHTML = list.length
        ? list.map(t => `<tr>
            <td style="text-align:left"><span style="font-family:monospace;font-size:12px;font-weight:700;background:var(--bg);border:1px solid var(--border);padding:3px 9px;border-radius:5px">${t.rfid_uid}</span></td>
            <td style="text-align:left">${nameCell(t.name)}</td>
            <td style="font-size:12px;color:var(--muted);text-align:center">${t.email||'—'}</td>
            <td style="font-size:12px;color:var(--muted);text-align:center">${t.last_scan}</td>
            <td style="font-weight:600;text-align:center">${t.total_scans}</td>
            <td style="text-align:center">${badgeEl('active','assigned')}</td>
            <td style="text-align:center"><button class="action-btn edit-btn" onclick="showToast('Reassign coming soon')">Reassign</button></td>
          </tr>`).join('')
        : `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:20px">No RFID tags found</td></tr>`;
    });
}

function addRFID() { showToast('ℹ️ Assign RFID via the Students page'); closeModal('rfid'); }

// ── REPORTS ──
function renderReports() {
  fetch('/api/admin/reports')
    .then(r => r.json())
    .then(d => {
      document.getElementById('rp-rate').textContent    = d.overall + '%';
      document.getElementById('rp-scans').textContent   = d.total_scans;
      document.getElementById('rp-flagged').textContent = d.flagged_count;
      document.getElementById('rp-perfect').textContent = d.perfect;
      subjectBarsFromData('rp-subj-bars', d.subjects);
      document.getElementById('rp-flagged-body').innerHTML = d.flagged.length
        ? d.flagged.map(s => `<tr>
            <td>${nameCell(s.name)}</td>
            <td class="mono">${s.rfid_uid||'—'}</td>
            <td style="font-weight:700;color:var(--red)">${s.rate}%</td>
            <td style="color:var(--red)">${s.absent} days</td>
            <td style="text-align:center;vertical-align:middle;"><button class="btn btn-outline btn-sm" onclick="showToast('Notification sent for ${s.name}')">Notify</button></td>
          </tr>`).join('')
        : `<tr><td colspan="5" style="text-align:center;color:var(--green);padding:20px">✅ All students are above 80%</td></tr>`;
    });
}

// ── EDIT STATUS MODAL ──
let _editCtx = null;
function openEditModal(id, name, subj, currentStatus) {
  _editCtx = { id, subj };
  document.getElementById('edit-lbl').textContent = `${name}  ·  ${subj}`;
  document.querySelectorAll('.modal-status-btn').forEach(btn => {
    const cur = btn.dataset.status === currentStatus;
    btn.style.borderColor = cur ? 'var(--green)' : 'var(--border)';
    btn.style.background  = cur ? 'var(--green-hover)' : 'white';
  });
  openModal('edit');
}

function applyStatus(newStatus) {
  if (!_editCtx) return;
  fetch('/api/admin/attendance/' + _editCtx.id, {
    method: 'PATCH', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ status: newStatus })
  })
  .then(() => {
    if (document.getElementById('att-body')) renderAttendance();
    if (document.getElementById('d-rate'))   renderDashboard();
    showToast('✅ Status updated to ' + newStatus);
    closeModal('edit'); _editCtx = null;
  });
}

// ── MODAL HELPERS ──
function openModal(id)  { document.getElementById('modal-'+id).classList.add('open'); }
function closeModal(id) { document.getElementById('modal-'+id).classList.remove('open'); }
function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ── SOCKET — live update on RFID scan ──
(function initAdminSocket() {
  if (typeof io === 'undefined') return;
  const socket = io('http://127.0.0.1:5000', { transports: ['websocket'] });
  socket.on('student_scanned', data => {
    showToast('📡 ' + data.student_first + ' ' + data.student_last + ' — ' + data.status);
    if (document.getElementById('att-body')) renderAttendance();
    if (document.getElementById('d-rate'))   renderDashboard();
    if (document.getElementById('rec-body')) renderRecords();
  });
})();