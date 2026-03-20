from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_socketio import SocketIO
from datetime import datetime, time, timedelta, date
import pymysql

app = Flask(__name__)
app.config["SECRET_KEY"] = "passpoint-secret-key-2024-xK9mP2qR"
socketio = SocketIO(app=app, cors_allowed_origins="*")
connection = pymysql.connect(
    host="localhost",
    port=3306,
    user="root",
    password="Geoff@1504",
    database="passpoint_db",
    cursorclass=pymysql.cursors.DictCursor,
    autocommit=True
)
cursor = connection.cursor()

def timedelta_to_time(value):
    """MySQL TIME columns return timedelta — convert to time if needed."""
    if hasattr(value, "total_seconds"):
        secs = int(value.total_seconds())
        return time(secs // 3600, (secs % 3600) // 60, secs % 60)
    return value


def determine_status(now: time, class_start: time, class_end: time) -> str:
    late_cutoff = (datetime.combine(datetime.today(), class_start) + timedelta(minutes=10)).time()
    if now < class_start:
        return "absent"
    elif now <= late_cutoff:
        return "present"
    return "late"

# ── Index ──
@app.route('/')
def index():
    return render_template('index.html')

@app.route("/login", methods=["POST"])
def login():
    email = request.form.get("email")
    password = request.form.get("password")
    
    sql = "SELECT * FROM students WHERE email = %s AND password = %s"
    cursor.execute(sql, (email, password))
    result = cursor.fetchone()

    if not result:
        return redirect(url_for("index"))

    session["USER_LOGGED_IN"] = result

    return redirect(url_for("student_dashboard"))

# ── Scan RFID ──
@app.route('/scan_rfid', methods=["POST"])
def scan_rfid():
    card_number = request.get_json()

    if not card_number:
        return {"status": 404, "detail": "No card number provided"}, 404
    now_time = datetime.now().time()

    cursor.execute("""
        SELECT s.id AS student_id,
               c.id AS class_id,
               c.start_time,
               c.end_time
        FROM students s
        JOIN classes c ON c.student_id = s.id
        WHERE s.rfid_uid = %s
        ORDER BY c.start_time ASC
        LIMIT 1
    """, (card_number,))
    result = cursor.fetchone()

    if not result:
        return jsonify({"message": "Card not recognized"}), 404

    student_id = result["student_id"]
    class_id = result["class_id"]
    class_start = timedelta_to_time(result["start_time"])
    class_end = timedelta_to_time(result["end_time"])

    # Block duplicate scans for the same student + class on the same day
    cursor.execute("""
        SELECT id FROM attendance_logs
        WHERE student_id = %s
          AND class_id = %s
          AND DATE(scanned_at) = CURDATE()
        LIMIT 1
    """, (student_id, class_id))
    if cursor.fetchone():
        return jsonify({"message": "Already scanned for this class today"}), 409

    status = determine_status(now_time, class_start, class_end)

    cursor.execute("""
        INSERT INTO attendance_logs (student_id, class_id, rfid_uid, scanned_at, status)
        VALUES (%s, %s, %s, %s, %s)
    """, (student_id, class_id, card_number, datetime.now(), status))
    connection.commit()

    cursor.execute("""
        SELECT a.status,
               a.scanned_at,
               s.first_name AS student_first,
               s.last_name  AS student_last,
               s.rfid_uid,
               c.subject,
               c.room,
               TIME_FORMAT(c.start_time, '%%H:%%i:%%s') AS start_time,
               TIME_FORMAT(c.end_time,   '%%H:%%i:%%s') AS end_time,
               t.first_name AS teacher_first,
               t.last_name  AS teacher_last
        FROM attendance_logs a
        JOIN students s ON a.student_id = s.id
        JOIN classes  c ON a.class_id   = c.id
        JOIN teachers t ON c.teacher_id = t.id
        WHERE a.student_id = %s AND a.class_id = %s
        ORDER BY a.scanned_at DESC
        LIMIT 1
    """, (student_id, class_id))
    full_info = cursor.fetchone()
    full_info["scanned_at"] = full_info["scanned_at"].strftime("%B %#d, %#I:%M %p")

    socketio.emit("student_scanned", full_info)

    return jsonify({"student_id": student_id, "class_id": class_id, "status": status})
# ── Student Portal ──
@app.route('/studentportal')
def student_dashboard():
    import calendar as cal_mod
    user = session.get("USER_LOGGED_IN")
    if not user:
        return redirect(url_for("index"))
    student_id = user["id"]

    cursor.execute("SELECT * FROM students WHERE id = %s", (student_id,))
    student = cursor.fetchone()

    today = date.today()

    # ── Today's classes ──
    cursor.execute("""
        SELECT a.status, a.scanned_at, c.subject, c.room,
               TIME_FORMAT(c.start_time, '%%H:%%i:%%s') AS start_time,
               TIME_FORMAT(c.end_time,   '%%H:%%i:%%s') AS end_time,
               t.first_name AS teacher_first, t.last_name AS teacher_last
        FROM attendance_logs a
        JOIN classes c ON a.class_id = c.id
        JOIN teachers t ON c.teacher_id = t.id
        WHERE a.student_id = %s AND DATE(a.scanned_at) = %s
        ORDER BY c.start_time ASC
    """, (student_id, today))
    attendance_today = cursor.fetchall()

    # ── Overall stats ──
    cursor.execute("""
        SELECT COUNT(*) AS total,
               SUM(status='present') AS present_count,
               SUM(status='absent')  AS absent_count,
               SUM(status='late')    AS late_count
        FROM attendance_logs WHERE student_id = %s
    """, (student_id,))
    s = cursor.fetchone()
    total   = s["total"] or 0
    present = int(s["present_count"] or 0)
    absent  = int(s["absent_count"]  or 0)
    late    = int(s["late_count"]    or 0)
    rate    = round((present / total * 100) if total > 0 else 0)

    # ── Absent this week ──
    cursor.execute("""
        SELECT COUNT(*) AS absent_week FROM attendance_logs
        WHERE student_id = %s AND status = 'absent'
          AND YEARWEEK(scanned_at, 1) = YEARWEEK(CURDATE(), 1)
    """, (student_id,))
    absent_week = cursor.fetchone()["absent_week"] or 0

    # ── Calendar data for current month ──
    cursor.execute("""
        SELECT DAY(scanned_at) AS day, status FROM attendance_logs
        WHERE student_id = %s
          AND MONTH(scanned_at) = MONTH(CURDATE())
          AND YEAR(scanned_at)  = YEAR(CURDATE())
        ORDER BY scanned_at ASC
    """, (student_id,))
    priority = {"present": 2, "late": 1, "absent": 0}
    cal_data = {}
    for row in cursor.fetchall():
        d, st = row["day"], row["status"]
        if d not in cal_data or priority.get(st, -1) < priority.get(cal_data[d], -1):
            cal_data[d] = st

    # ── Subject breakdown ──
    cursor.execute("""
        SELECT c.subject, COUNT(*) AS total, SUM(a.status='present') AS present_count
        FROM attendance_logs a JOIN classes c ON a.class_id = c.id
        WHERE a.student_id = %s GROUP BY c.subject ORDER BY c.subject
    """, (student_id,))
    subjects = []
    for row in cursor.fetchall():
        t  = row["total"] or 1
        p  = int(row["present_count"] or 0)
        pct = round(p / t * 100)
        label = "Good" if pct >= 80 else ("Risk" if pct >= 60 else "Low")
        subjects.append({"name": row["subject"], "pct": pct, "label": label})

    month_name       = today.strftime("%B %Y")
    today_day        = today.day
    first_weekday_sun = (today.replace(day=1).weekday() + 1) % 7
    days_in_month    = cal_mod.monthrange(today.year, today.month)[1]

    return render_template(
        'StudentPortal/dashboard.html',
        student=student,
        attendance_today=attendance_today,
        rate=rate, present=present, absent=absent,
        absent_week=absent_week, late=late,
        cal_data=cal_data, today_day=today_day,
        month_name=month_name,
        first_weekday_sun=first_weekday_sun,
        days_in_month=days_in_month,
        subjects=subjects,
    )

@app.route('/studentportal/attendance')
def student_attendance():
    return render_template('StudentPortal/attendance.html')

@app.route('/studentportal/scanrfid')
def student_scanrfid():
    user = session.get("USER_LOGGED_IN")
    if not user:
        return redirect(url_for("index"))
    student_id = user["id"]
    sql = """
        SELECT a.status,
               a.scanned_at,
               c.subject,
               c.room,
               TIME_FORMAT(c.start_time, '%%H:%%i:%%s') AS start_time,
               TIME_FORMAT(c.end_time, '%%H:%%i:%%s') AS end_time,
               t.first_name AS teacher_first,
               t.last_name AS teacher_last
        FROM attendance_logs a
        JOIN classes c ON a.class_id = c.id
        JOIN teachers t ON c.teacher_id = t.id
        WHERE a.student_id = %s
          AND DATE(a.scanned_at) = %s
        ORDER BY c.start_time ASC
    """
    today = date.today()
    cursor.execute(sql, (student_id, today))
    attendance_today = cursor.fetchall()

    return render_template('StudentPortal/scanrfid.html', attendance_today=attendance_today)

@app.route('/studentportal/schedule')
def student_schedule():
    return render_template('StudentPortal/schedule.html')

@app.route('/studentportal/profile')
def student_profile():
    return render_template('StudentPortal/profile.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

# ── Teacher Portal ──
@app.route('/teacherportal')
def teacher_dashboard():
    return render_template('TeacherPortal/dashboard.html')

@app.route('/teacherportal/attendance')
def teacher_attendance():
    return render_template('TeacherPortal/attendance.html')

@app.route('/teacherportal/records')
def teacher_records():
    return render_template('TeacherPortal/records.html')

@app.route('/teacherportal/students')
def teacher_students():
    return render_template('TeacherPortal/students.html')

@app.route('/api/students', methods=["GET"])
def api_get_students():
    cursor.execute("""
        SELECT s.id, s.first_name, s.last_name, s.email, s.rfid_uid,
               COUNT(a.id)                          AS total,
               SUM(a.status = 'present')            AS present_count,
               SUM(a.status = 'late')               AS late_count,
               SUM(a.status = 'absent')             AS absent_count,
               MAX(a.scanned_at)                    AS last_scan
        FROM students s
        LEFT JOIN attendance_logs a ON a.student_id = s.id
        GROUP BY s.id
        ORDER BY s.last_name, s.first_name
    """)
    rows = cursor.fetchall()
    for r in rows:
        total = r["total"] or 0
        present = int(r["present_count"] or 0)
        late    = int(r["late_count"]    or 0)
        r["rate"] = round((present + late) / total * 100) if total > 0 else 0
        r["last_scan"] = r["last_scan"].strftime("%b %d, %I:%M %p") if r["last_scan"] else "—"
    return jsonify(rows)

@app.route('/api/students', methods=["POST"])
def api_add_student():
    data = request.get_json()
    first_name = (data.get("first_name") or "").strip()
    last_name  = (data.get("last_name")  or "").strip()
    email      = (data.get("email")      or "").strip()
    rfid_uid   = (data.get("rfid_uid")   or "").strip()
    password   = (data.get("password")   or "password123").strip()

    if not first_name or not last_name or not email:
        return jsonify({"error": "First name, last name, and email are required."}), 400

    # Check duplicate email
    cursor.execute("SELECT id FROM students WHERE email = %s", (email,))
    if cursor.fetchone():
        return jsonify({"error": "A student with this email already exists."}), 409

    cursor.execute("""
        INSERT INTO students (first_name, last_name, email, password, rfid_uid)
        VALUES (%s, %s, %s, %s, %s)
    """, (first_name, last_name, email, password, rfid_uid or None))
    return jsonify({"success": True, "id": cursor.lastrowid}), 201

@app.route('/teacherportal/classes')
def teacher_classes():
    return render_template('TeacherPortal/classes.html')

@app.route('/teacherportal/profile')
def teacher_profile():
    return render_template('TeacherPortal/profile.html')

# ── Admin Portal ──
@app.route('/adminportal')
def admin_dashboard():
    return render_template('AdminPortal/dashboard.html')

@app.route('/adminportal/attendance')
def admin_attendance():
    return render_template('AdminPortal/attendance.html')

@app.route('/adminportal/records')
def admin_records():
    return render_template('AdminPortal/records.html')

@app.route('/adminportal/teachers')
def admin_teachers():
    return render_template('AdminPortal/teachers.html')

@app.route('/adminportal/students')
def admin_students():
    return render_template('AdminPortal/students.html')

@app.route('/adminportal/rfidtags')
def admin_rfidtags():
    return render_template('AdminPortal/rfidtags.html')

@app.route('/api/admin/teachers/<int:teacher_id>', methods=["DELETE"])
def api_admin_delete_teacher(teacher_id):
    cursor.execute("DELETE FROM teachers WHERE id=%s", (teacher_id,))
    return jsonify({'success': True})

@app.route('/api/admin/students/<int:student_id>', methods=["DELETE"])
def api_admin_delete_student(student_id):
    cursor.execute("DELETE FROM attendance_logs WHERE student_id=%s", (student_id,))
    cursor.execute("DELETE FROM students WHERE id=%s", (student_id,))
    return jsonify({'success': True})

@app.route('/adminportal/reports')
def admin_reports():
    return render_template('AdminPortal/reports.html')

# ── Admin API ──
@app.route('/api/admin/dashboard')
def api_admin_dashboard():
    today = date.today()
    # Today's scans
    cursor.execute("""
        SELECT a.status, a.scanned_at, s.first_name, s.last_name, s.rfid_uid,
               c.subject, c.room, t.first_name AS teacher_first, t.last_name AS teacher_last
        FROM attendance_logs a
        JOIN students s ON a.student_id = s.id
        JOIN classes  c ON a.class_id   = c.id
        JOIN teachers t ON c.teacher_id = t.id
        WHERE DATE(a.scanned_at) = %s
        ORDER BY a.scanned_at DESC
    """, (today,))
    scans = cursor.fetchall()
    for r in scans:
        r['scanned_at'] = r['scanned_at'].strftime('%I:%M %p')
        r['name'] = r['first_name'] + ' ' + r['last_name']

    # Stats
    cursor.execute("SELECT COUNT(*) AS cnt FROM students")
    total_students = cursor.fetchone()['cnt']
    cursor.execute("SELECT COUNT(*) AS cnt FROM teachers")
    total_teachers = cursor.fetchone()['cnt']

    # Overall rate today
    present = sum(1 for r in scans if r['status'] != 'absent')
    rate = round(present / len(scans) * 100) if scans else 0

    # Flagged (below 80%)
    cursor.execute("""
        SELECT s.id, COUNT(*) AS total, SUM(a.status='present') + SUM(a.status='late') AS attended
        FROM students s JOIN attendance_logs a ON a.student_id = s.id
        GROUP BY s.id HAVING ROUND(attended/total*100) < 80
    """)
    flagged = cursor.fetchall()

    # Subject bars
    cursor.execute("""
        SELECT c.subject,
               COUNT(*) AS total,
               SUM(a.status != 'absent') AS attended
        FROM attendance_logs a JOIN classes c ON a.class_id = c.id
        GROUP BY c.subject
    """)
    subjects = []
    for row in cursor.fetchall():
        t = row['total'] or 1
        p = int(row['attended'] or 0)
        pct = round(p / t * 100)
        subjects.append({'subject': row['subject'], 'pct': pct})

    # Top & low attendees
    cursor.execute("""
        SELECT s.id, s.first_name, s.last_name,
               COUNT(*) AS total,
               SUM(a.status != 'absent') AS attended,
               SUM(a.status = 'absent') AS absent_count
        FROM students s JOIN attendance_logs a ON a.student_id = s.id
        GROUP BY s.id ORDER BY attended/total DESC
    """)
    ranked = []
    for row in cursor.fetchall():
        t = row['total'] or 1
        rate_r = round(int(row['attended'] or 0) / t * 100)
        ranked.append({
            'name': row['first_name'] + ' ' + row['last_name'],
            'rate': rate_r,
            'absent': int(row['absent_count'] or 0)
        })

    return jsonify({
        'rate': rate, 'total_students': total_students,
        'total_teachers': total_teachers, 'flagged': len(flagged),
        'scans': scans, 'subjects': subjects,
        'top': ranked[:5], 'low': [r for r in ranked if r['rate'] < 80][-5:]
    })

@app.route('/api/admin/attendance')
def api_admin_attendance():
    today = date.today()
    subj   = request.args.get('subject', '')
    status = request.args.get('status', '')
    q      = request.args.get('q', '').lower()
    cursor.execute("""
        SELECT a.id, a.status, a.scanned_at, s.first_name, s.last_name, s.rfid_uid,
               c.subject, c.room
        FROM attendance_logs a
        JOIN students s ON a.student_id = s.id
        JOIN classes  c ON a.class_id   = c.id
        WHERE DATE(a.scanned_at) = %s
        ORDER BY a.scanned_at DESC
    """, (today,))
    rows = cursor.fetchall()
    result = []
    for r in rows:
        name = r['first_name'] + ' ' + r['last_name']
        if subj   and r['subject'] != subj: continue
        if status and r['status']  != status.lower(): continue
        if q      and q not in name.lower() and q not in (r['rfid_uid'] or '').lower(): continue
        result.append({
            'id': r['id'], 'name': name, 'rfid_uid': r['rfid_uid'],
            'time_in': r['scanned_at'].strftime('%I:%M %p'),
            'subject': r['subject'], 'room': r['room'], 'status': r['status']
        })
    return jsonify(result)

@app.route('/api/admin/attendance/<int:log_id>', methods=["PATCH"])
def api_admin_edit_attendance(log_id):
    data = request.get_json()
    new_status = data.get('status')
    if new_status not in ('present', 'late', 'absent'):
        return jsonify({'error': 'Invalid status'}), 400
    cursor.execute("UPDATE attendance_logs SET status=%s WHERE id=%s", (new_status, log_id))
    return jsonify({'success': True})

@app.route('/api/admin/records')
def api_admin_records():
    date_val = request.args.get('date', '')
    subj     = request.args.get('subject', '')
    status   = request.args.get('status', '')
    q        = request.args.get('q', '').lower()
    sql = """
        SELECT a.id, a.status, a.scanned_at, s.first_name, s.last_name, s.rfid_uid, c.subject
        FROM attendance_logs a
        JOIN students s ON a.student_id = s.id
        JOIN classes  c ON a.class_id   = c.id
        WHERE 1=1
    """
    params = []
    if date_val:
        sql += " AND DATE(a.scanned_at) = %s"; params.append(date_val)
    if subj:
        sql += " AND c.subject = %s"; params.append(subj)
    if status:
        sql += " AND a.status = %s"; params.append(status.lower())
    sql += " ORDER BY a.scanned_at DESC LIMIT 200"
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    result = []
    for r in rows:
        name = r['first_name'] + ' ' + r['last_name']
        if q and q not in name.lower() and q not in (r['rfid_uid'] or '').lower(): continue
        result.append({
            'id': r['id'], 'name': name, 'rfid_uid': r['rfid_uid'],
            'date': r['scanned_at'].strftime('%b %d, %Y'),
            'time_in': r['scanned_at'].strftime('%I:%M %p'),
            'subject': r['subject'], 'status': r['status']
        })
    return jsonify(result)

@app.route('/api/admin/teachers', methods=["GET"])
def api_admin_get_teachers():
    cursor.execute("SELECT * FROM teachers ORDER BY last_name, first_name")
    return jsonify(cursor.fetchall())

@app.route('/api/admin/teachers', methods=["POST"])
def api_admin_add_teacher():
    data = request.get_json()
    first = (data.get('first_name') or '').strip()
    last  = (data.get('last_name')  or '').strip()
    email = (data.get('email')      or '').strip()
    if not first or not last:
        return jsonify({'error': 'First and last name are required'}), 400
    cursor.execute("""
        INSERT INTO teachers (first_name, last_name, email)
        VALUES (%s, %s, %s)
    """, (first, last, email or None))
    return jsonify({'success': True, 'id': cursor.lastrowid}), 201

@app.route('/api/admin/students', methods=["GET"])
def api_admin_get_students():
    cursor.execute("""
        SELECT s.id, s.first_name, s.last_name, s.email, s.rfid_uid,
               COUNT(a.id) AS total,
               SUM(a.status='present') AS present_count,
               SUM(a.status='late')    AS late_count,
               SUM(a.status='absent')  AS absent_count,
               MAX(a.scanned_at)       AS last_scan
        FROM students s LEFT JOIN attendance_logs a ON a.student_id = s.id
        GROUP BY s.id ORDER BY s.last_name, s.first_name
    """)
    rows = cursor.fetchall()
    for r in rows:
        total   = r['total'] or 0
        present = int(r['present_count'] or 0) + int(r['late_count'] or 0)
        r['rate'] = round(present / total * 100) if total > 0 else 0
        r['last_scan'] = r['last_scan'].strftime('%b %d, %I:%M %p') if r['last_scan'] else '—'
    return jsonify(rows)

@app.route('/api/admin/rfidtags', methods=["GET"])
def api_admin_get_rfid():
    cursor.execute("""
        SELECT s.rfid_uid, s.first_name, s.last_name, s.id AS student_id,
               COUNT(a.id) AS total_scans, MAX(a.scanned_at) AS last_scan
        FROM students s LEFT JOIN attendance_logs a ON a.student_id = s.id
        WHERE s.rfid_uid IS NOT NULL AND s.rfid_uid != ''
        GROUP BY s.id
    """)
    rows = cursor.fetchall()
    for r in rows:
        r['name'] = r['first_name'] + ' ' + r['last_name']
        r['last_scan'] = r['last_scan'].strftime('%b %d, %I:%M %p') if r['last_scan'] else 'Never'
    return jsonify(rows)

@app.route('/api/admin/reports')
def api_admin_reports():
    cursor.execute("""
        SELECT COUNT(*) AS total, SUM(status!='absent') AS attended FROM attendance_logs
    """)
    s = cursor.fetchone()
    total = s['total'] or 0
    attended = int(s['attended'] or 0)
    overall = round(attended / total * 100) if total > 0 else 0

    cursor.execute("""
        SELECT s.id, s.first_name, s.last_name, s.rfid_uid,
               COUNT(*) AS total, SUM(a.status='absent') AS absent_count,
               SUM(a.status!='absent') AS attended
        FROM students s JOIN attendance_logs a ON a.student_id=s.id
        GROUP BY s.id
    """)
    flagged = []
    perfect = 0
    subjects_data = {}
    for row in cursor.fetchall():
        t = row['total'] or 1
        a = int(row['attended'] or 0)
        rate = round(a / t * 100)
        if rate < 80:
            flagged.append({
                'name': row['first_name'] + ' ' + row['last_name'],
                'rfid_uid': row['rfid_uid'], 'rate': rate,
                'absent': int(row['absent_count'] or 0)
            })
        if rate == 100:
            perfect += 1

    cursor.execute("""
        SELECT c.subject, COUNT(*) AS total, SUM(a.status!='absent') AS attended
        FROM attendance_logs a JOIN classes c ON a.class_id=c.id GROUP BY c.subject
    """)
    subjects = []
    for row in cursor.fetchall():
        t = row['total'] or 1
        pct = round(int(row['attended'] or 0) / t * 100)
        subjects.append({'subject': row['subject'], 'pct': pct})

    return jsonify({
        'overall': overall, 'total_scans': total,
        'flagged_count': len(flagged), 'perfect': perfect,
        'flagged': flagged, 'subjects': subjects
    })

if __name__ == '__main__':
    socketio.run(app, debug=True)