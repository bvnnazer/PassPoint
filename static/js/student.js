/* ── Sidebar toggle ── */
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  sb.classList.toggle('collapsed');
  localStorage.setItem('sidebar_collapsed', sb.classList.contains('collapsed') ? '1' : '0');
}

// Restore sidebar state instantly — no transition flash
(function restoreSidebar() {
  if (localStorage.getItem('sidebar_collapsed') !== '1') return;
  const sb = document.getElementById('sidebar');
  if (!sb) return;
  sb.style.transition = 'none';
  sb.classList.add('collapsed');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    sb.style.transition = '';
  }));
})();

/* ── Attendance Records Data ── */
const records = [
  { date:'Jun 5, 2025', subject:'Data Structures',  time:'7:30 AM', teacher:'Reuben Mallorca', room:'CL 3', status:'present' },
  { date:'Jun 5, 2025', subject:'Web Development',  time:'7:30 AM', teacher:'Reuben Mallorca', room:'CL 3', status:'present' },
  { date:'Jun 5, 2025', subject:'Database Systems', time:'7:30 AM', teacher:'Reuben Mallorca', room:'CL 3', status:'late'    },
  { date:'Jun 5, 2025', subject:'Cybersecurity',    time:'7:30 AM', teacher:'Reuben Mallorca', room:'CL 3', status:'present' },
  { date:'Jun 5, 2025', subject:'Software Eng.',    time:'7:30 AM', teacher:'Reuben Mallorca', room:'CL 3', status:'present' },
  { date:'Jun 4, 2025', subject:'Data Structures',  time:'7:30 AM', teacher:'Reuben Mallorca', room:'CL 3', status:'present' },
  { date:'Jun 4, 2025', subject:'Web Development',  time:'7:30 AM', teacher:'Reuben Mallorca', room:'CL 3', status:'absent'  },
  { date:'Jun 4, 2025', subject:'Database Systems', time:'7:30 AM', teacher:'Reuben Mallorca', room:'CL 3', status:'present' },
  { date:'Jun 3, 2025', subject:'Cybersecurity',    time:'7:30 AM', teacher:'Reuben Mallorca', room:'CL 3', status:'absent'  },
  { date:'Jun 3, 2025', subject:'Software Eng.',    time:'7:30 AM', teacher:'Reuben Mallorca', room:'CL 3', status:'present' },
  { date:'Jun 3, 2025', subject:'Data Structures',  time:'7:30 AM', teacher:'Reuben Mallorca', room:'CL 3', status:'late'    },
  { date:'Jun 2, 2025', subject:'Web Development',  time:'7:30 AM', teacher:'Reuben Mallorca', room:'CL 3', status:'present' },
];

function renderTable(data) {
  const tbody = document.getElementById('att-tbody');
  if (!tbody) return;
  tbody.innerHTML = data.map(r => `
    <tr>
      <td>${r.date}</td>
      <td>${r.subject}</td>
      <td>${r.time}</td>
      <td>${r.teacher}</td>
      <td>${r.room}</td>
      <td><span class="status-badge ${r.status}">${r.status.charAt(0).toUpperCase()+r.status.slice(1)}</span></td>
    </tr>`).join('');
}

function filterTable() {
  const sub  = document.getElementById('filter-subject').value;
  const stat = document.getElementById('filter-status').value;
  const q    = document.getElementById('search-input').value.toLowerCase();
  const filtered = records.filter(r => {
    const matchSub  = sub  === 'All Subjects' || r.subject === sub;
    const matchStat = stat === 'All Status'   || r.status  === stat.toLowerCase();
    const matchQ    = !q || r.subject.toLowerCase().includes(q) || r.teacher.toLowerCase().includes(q) || r.date.toLowerCase().includes(q);
    return matchSub && matchStat && matchQ;
  });
  renderTable(filtered);
}

/* ── Nav active state — let Flask handle routing via href ── */
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    // Do nothing extra — just follow the href link naturally
  });
});

/* ── Calendar is server-rendered via Jinja2 — no JS needed ── */

/* ── Animate progress bars ── */
window.addEventListener('load', () => {
  document.querySelectorAll('.bar-fill').forEach(bar => {
    const w = bar.dataset.width;
    bar.style.width = '0%';
    setTimeout(() => { bar.style.width = w + '%'; }, 200);
  });

  // Init attendance filter listeners
  ['filter-subject','filter-status','filter-period'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', filterTable);
  });
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.addEventListener('input', filterTable);
  renderTable(records);
});

/* ── Schedule Data ── */
const scheduleData = {
  Monday: [
    { start: '7:30 AM', end: '9:00 AM',   subject: 'Data Structures',    room: 'PH 406', teacher: 'Reuben Mallorca', type: 'lecture' },
    { start: '9:00 AM', end: '10:30 AM',  subject: 'Web Development',    room: 'PH 402', teacher: 'Maria Santos',    type: 'lab'     },
    { start: '10:30 AM',end: '12:00 PM',  subject: 'Database Systems',   room: 'PH 405', teacher: 'Jose Reyes',      type: 'lecture' },
    { start: '1:00 PM', end: '2:30 PM',   subject: 'Software Engineering',room: 'PH 408', teacher: 'Ana Cruz',        type: 'seminar' },
    { start: '2:30 PM', end: '4:00 PM',   subject: 'Cybersecurity',       room: 'PH 410', teacher: 'Mark Lim',        type: 'lecture' },
  ],
  Tuesday: [
    { start: '7:30 AM', end: '9:00 AM',  subject: 'Web Development',  room: 'PH 402', teacher: 'Maria Santos',    type: 'lab'     },
    { start: '9:00 AM', end: '10:30 AM', subject: 'Cybersecurity',    room: 'PH 410', teacher: 'Mark Lim',        type: 'lecture' },
    { start: '1:00 PM', end: '2:30 PM',  subject: 'Data Structures',  room: 'PH 406', teacher: 'Reuben Mallorca', type: 'lecture' },
  ],
  Wednesday: [
    { start: '8:00 AM',  end: '9:30 AM',  subject: 'Database Systems',    room: 'PH 405', teacher: 'Jose Reyes', type: 'lab'     },
    { start: '10:00 AM', end: '11:30 AM', subject: 'Software Engineering', room: 'PH 408', teacher: 'Ana Cruz',  type: 'lecture' },
    { start: '1:00 PM',  end: '2:30 PM',  subject: 'Cybersecurity',        room: 'PH 410', teacher: 'Mark Lim',  type: 'seminar' },
  ],
  Thursday: [
    { start: '7:30 AM', end: '9:00 AM',  subject: 'Data Structures',     room: 'PH 406', teacher: 'Reuben Mallorca', type: 'lab'     },
    { start: '9:00 AM', end: '10:30 AM', subject: 'Web Development',     room: 'PH 402', teacher: 'Maria Santos',    type: 'lecture' },
    { start: '2:30 PM', end: '4:00 PM',  subject: 'Software Engineering', room: 'PH 408', teacher: 'Ana Cruz',       type: 'seminar' },
  ],
  Friday: [
    { start: '7:30 AM', end: '9:00 AM',  subject: 'Database Systems', room: 'PH 405', teacher: 'Jose Reyes',   type: 'lecture' },
    { start: '9:00 AM', end: '10:30 AM', subject: 'Cybersecurity',    room: 'PH 410', teacher: 'Mark Lim',     type: 'lecture' },
    { start: '1:00 PM', end: '3:00 PM',  subject: 'Web Development',  room: 'PH 402', teacher: 'Maria Santos', type: 'lab'     },
  ],
   Saturday: [
    { start: '7:30 AM', end: '9:00 AM',  subject: 'Data Structures',     room: 'PH 406', teacher: 'Reuben Mallorca', type: 'lecture' },
    { start: '9:00 AM', end: '10:30 AM', subject: 'Software Engineering', room: 'PH 408', teacher: 'Ana Cruz',        type: 'seminar' },
    { start: '10:30 AM',end: '12:00 PM', subject: 'Database Systems',     room: 'PH 405', teacher: 'Jose Reyes',      type: 'lab'     },
  ],
};

function renderSchedule(day) {
  const grid = document.getElementById('schedule-grid');
  if (!grid) return;
  const classes = scheduleData[day] || [];
  grid.innerHTML = classes.map(c => `
    <div class="sched-card">
      <div class="sched-time-block">
        <strong>${c.start}</strong>
        ${c.end}
      </div>
      <div class="sched-divider"></div>
      <div class="sched-info">
        <div class="sched-subject">${c.subject}</div>
        <div class="sched-meta">
          <span>
            <svg viewBox="0 0 24 24" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            ${c.room}
          </span>
          <span>
            <svg viewBox="0 0 24 24" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 20h13a2 2 0 0 0-13 0z"/></svg>
            ${c.teacher}
          </span>
        </div>
      </div>
      <span class="sched-badge ${c.type}">${c.type.charAt(0).toUpperCase()+c.type.slice(1)}</span>
    </div>`).join('');
}

/* ── Day tab switching ── */
document.querySelectorAll(".day-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".day-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    const day = tab.dataset.day;
    renderSchedule(day);
  });
});

renderSchedule('Monday');

/* ── RFID Scan Logic ── */
(function initRFID() {
  const rfidLog     = document.querySelector('.rfid-log');
  const cardIdEl    = document.getElementById('rfid-card-id');
  const lastScanned = document.querySelector('.last-scanned');
  const statusLabel = document.querySelector('.rfid-status-label');
  const statusSub   = document.querySelector('.rfid-status-sub');

  if (!rfidLog) return; // not on scan rfid page

  const socket = io("http://127.0.0.1:5000", { transports: ["websocket"] });

  socket.on("student_scanned", data => {
    if (cardIdEl)    cardIdEl.textContent    = data.rfid_uid;
    if (lastScanned) lastScanned.textContent = data.scanned_at;
    if (statusLabel) statusLabel.textContent = "Attendance Recorded Successfully";
    if (statusSub)   statusSub.textContent   = `Good day, ${data.student_first} ${data.student_last}. Your attendance has been logged.`;

    const empty = document.getElementById('rfid-log-empty');
    if (empty) empty.remove();

    const item = document.createElement('div');
    item.className = 'class-item';
    item.innerHTML = `
      <span class="class-time">${data.scanned_at}</span>
      <span class="dot green"></span>
      <div class="class-info">
        <div class="class-name">${data.subject}</div>
        <div class="class-sub">${data.room} · ${data.teacher_first} ${data.teacher_last}</div>
      </div>
      <span class="badge ${data.status}">${data.status.toUpperCase()}</span>
    `;
    rfidLog.appendChild(item);

    setTimeout(() => {
      if (statusLabel) statusLabel.textContent = "Awaiting Card Presentation";
      if (statusSub)   statusSub.textContent   = "Please hold your RFID card near the reader.";
    }, 3000);
  });
})();

/* ── Dashboard Socket — update today's classes + calendar live on scan ── */
(function initDashboardSocket() {
  const classList = document.querySelector('.class-list-scroll');
  if (!classList) return; // not on dashboard page
  if (typeof io === 'undefined') return;

  const socket = io("http://127.0.0.1:5000", { transports: ["websocket"] });

  socket.on("student_scanned", data => {
    // 1. Append to Today's Class Schedule immediately
    classList.innerHTML += `
      <div class="class-item">
        <span class="class-time">${data.scanned_at}</span>
        <span class="dot green"></span>
        <div class="class-info">
          <div class="class-name">${data.subject}</div>
          <div class="class-sub">${data.room} · ${data.teacher_first} ${data.teacher_last}</div>
        </div>
        <span class="badge ${data.status}">${data.status.toUpperCase()}</span>
      </div>
    `;

    // 2. Update calendar — find today's cell and apply status color
    const today = new Date().getDate();
    const calDays = document.querySelectorAll('.cal-day');
    calDays.forEach(cell => {
      if (parseInt(cell.textContent) === today && !cell.classList.contains('empty')) {
        cell.classList.remove('present', 'absent', 'late');
        cell.classList.add(data.status);
      }
    });

    // 3. Reload after 1.5s so stats and weekly overview refresh from DB
    setTimeout(() => location.reload(), 1500);
  });
})();