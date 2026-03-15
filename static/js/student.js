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

/* ── Nav active state + page switching ── */
const pages = {
  'Dashboard':     'page-dashboard',
  'My Attendance': 'page-attendance',
  'Schedule':      'page-schedule',
  'Scan RFID':     'page-rfid'
};

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    const label = item.querySelector('.nav-label')?.textContent.trim();
    const pageId = pages[label];
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    if (pageId) document.getElementById(pageId).classList.add('active');
    else document.getElementById('page-dashboard').classList.add('active');
  });
});

/* ── Build calendar ── */
(function buildCalendar() {
  const cal = document.getElementById('calendar');
  if (!cal) return;
  const days = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  days.forEach(d => {
    const h = document.createElement('div');
    h.className = 'cal-head'; h.textContent = d;
    cal.appendChild(h);
  });

  const totalDays = 30;
  const startDay  = 0; // Sunday

  const status = {
    2:'p',3:'p',4:'p',5:'p',6:'p',
    9:'p',10:'p',11:'l',12:'p',13:'p',
    16:'p',17:'p',18:'p',19:'a',20:'p',
    23:'p',24:'p',25:'a',26:'p',27:'p',
  };

  for (let i = 0; i < startDay; i++) {
    const e = document.createElement('div');
    e.className = 'cal-day empty'; e.textContent = ' ';
    cal.appendChild(e);
  }

  for (let d = 1; d <= totalDays; d++) {
    const el = document.createElement('div');
    el.className = 'cal-day';
    el.textContent = d;
    const s = status[d];
    if (s === 'p') el.classList.add('present');
    else if (s === 'a') el.classList.add('absent');
    else if (s === 'l') el.classList.add('late');
    if (d === 5) el.classList.add('today');
    cal.appendChild(el);
  }
})();

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
  // Only run on pages that have the rfid elements
  const rfidLog     = document.querySelector('.rfid-log');
  const cardIdEl    = document.getElementById('rfid-card-id');
  const lastScanned = document.querySelector('.last-scanned');
  const statusLabel = document.querySelector('.rfid-status-label');
  const statusSub   = document.querySelector('.rfid-status-sub');

  if (!rfidLog) return; // not on scan rfid page

  const socket = io("http://127.0.0.1:5000", {
    transports: ["websocket"]
  });

  // ── Student scanned successfully ──
  socket.on("student_scanned", data => {
    const { student, subject, classes: student_class } = data;

    // Update scanner card
    if (cardIdEl)    cardIdEl.textContent    = student.rfid_card.number;
    if (lastScanned) lastScanned.textContent = student.rfid_card.last_scanned;
    if (statusLabel) statusLabel.textContent = "Card Detected!";
    if (statusSub)   statusSub.textContent   = `Welcome, ${student.name}`;

    // Remove empty state on first scan
    const empty = document.getElementById('rfid-log-empty');
    if (empty) empty.remove();

    // Prepend log entry
    const item = document.createElement('div');
    item.className = 'rfid-log-item';
    item.innerHTML = `
      <span class="rfid-log-dot in"></span>
      <span class="rfid-log-time">${student_class.scanned_at}</span>
      <span class="rfid-log-desc">${subject.name} — ${subject.room}</span>
      <span class="rfid-log-badge present">PRESENT</span>
    `;
    rfidLog.prepend(item);

    // Reset scanner status after 3 seconds
    setTimeout(() => {
      if (statusLabel) statusLabel.textContent = "Waiting for Card…";
      if (statusSub)   statusSub.textContent   = "Hold your RFID card near the reader";
    }, 3000);
  });

  // ── Already scanned ──
  socket.on("already_scanned", data => {
    const { student } = data;
    if (statusLabel) statusLabel.textContent = "Already Recorded!";
    if (statusSub)   statusSub.textContent   = `${student.name} is already marked present`;

    setTimeout(() => {
      if (statusLabel) statusLabel.textContent = "Waiting for Card…";
      if (statusSub)   statusSub.textContent   = "Hold your RFID card near the reader";
    }, 3000);
  });
})();