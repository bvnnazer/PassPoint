from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_socketio import SocketIO
from datetime import datetime

app = Flask(__name__)
socketio = SocketIO(app=app, cors_allowed_origins="*")

students_data = {
    "students": [
        {
            "id": 1,
            "name": "Geo Sumanga",
            "initials": "GS",
            "course": "BSIT",
            "section": "2-12",
            "year_level": "3rd Year",
            "rfid_card": {
                "number": "E0:47:1D:85",
                "status": "active",
                "last_scanned": ""
            }
        },
        {
            "id": 2,
            "name": "Maverick Barrientos",
            "initials": "MB",
            "course": "BSIT",
            "section": "2-1",
            "year_level": "2nd Year",
            "rfid_card": {
                "number": "A7:49:1D:85",
                "status": "active",
                "last_scanned": ""
            }
        }
    ]
}

subjects_data = {
    "subjects": [
        { "id": 1, "name": "Data Structures", "room": "PH 406", "section": "2-12" },
        { "id": 2, "name": "Web Development",  "room": "PH 402", "section": "2-12" },
        { "id": 3, "name": "Database Systems", "room": "PH 405", "section": "2-12" },
        { "id": 4, "name": "Data Structures",  "room": "PH 406", "section": "2-1"  },
    ]
}

class_scheduled = {
    "classes": [
        {
            "id": 1,
            "subject_id": 1,
            "student_id": 1,
            "status": "upcoming",
            "scanned_at": ""
        }
    ]
}

# ── Index ──
@app.route('/')
def login():
    return render_template('index.html')

# ── Scan RFID ──
@app.route('/scan_rfid', methods=["POST"])
def scan_rfid():
    data = request.get_json()
    card_number = data.get("card_number")

    if not card_number:
        return jsonify({"message": "No card number provided"}), 400

    for student in students_data["students"]:
        if student["rfid_card"]["number"] == card_number:
            student["rfid_card"]["last_scanned"] = datetime.now().strftime("Today, %I:%M %p")

            matched_class   = None
            matched_subject = None

            for classes in class_scheduled["classes"]:
                if classes.get("student_id") != student["id"]:
                    continue
                for subject in subjects_data["subjects"]:
                    if classes.get("subject_id") == subject.get("id"):
                        classes["status"]     = "present"
                        classes["scanned_at"] = datetime.now().strftime("Today, %I:%M %p")
                        matched_class   = classes
                        matched_subject = subject
                        break
                if matched_class:
                    break

            if matched_class and matched_subject:
                socketio.emit("student_scanned", {
                    "student": student,
                    "classes": matched_class,
                    "subject": matched_subject
                })
                return jsonify({"message": "Attendance recorded"}), 200

            return jsonify({"message": "No class found for this student"}), 404

    return jsonify({"message": "Card not recognized"}), 404

# ── Student Portal ──
@app.route('/studentportal')
def student_dashboard():
    return render_template('StudentPortal/dashboard.html')

@app.route('/studentportal/attendance')
def student_attendance():
    return render_template('StudentPortal/attendance.html')

@app.route('/studentportal/scanrfid')
def student_scanrfid():
    return render_template('StudentPortal/scanrfid.html')

@app.route('/studentportal/schedule')
def student_schedule():
    return render_template('StudentPortal/schedule.html')

@app.route('/studentportal/profile')
def student_profile():
    return render_template('StudentPortal/profile.html')

@app.route('/logout')
def logout():
    return redirect(url_for('login'))

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

@app.route('/teacherportal/classes')
def teacher_classes():
    return render_template('TeacherPortal/classes.html')

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

@app.route('/adminportal/reports')
def admin_reports():
    return render_template('AdminPortal/reports.html')

if __name__ == '__main__':
    socketio.run(app, debug=True)