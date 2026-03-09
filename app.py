from flask import Flask, render_template, url_for

app = Flask(__name__)

# Routes to handle page navigation
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/attendance')
def attendance():
    return render_template('attendance.html')

@app.route('/schedule')
def schedule():
    return render_template('schedule.html')

@app.route('/rfid')
def rfid():
    return render_template('rfid.html')

if __name__ == '__main__':
    app.run(debug=True)