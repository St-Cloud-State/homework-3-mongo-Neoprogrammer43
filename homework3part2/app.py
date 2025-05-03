# app.py
import sqlite3
import datetime
import pymongo
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# 1) This code sets up SQLite so that it can store our applications
SQLITE_PATH = 'applications.db'

def init_sqlite_db():
    conn = sqlite3.connect(SQLITE_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS applications (
            appNumber   INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL,
            address     TEXT    NOT NULL,
            status      TEXT    NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_sqlite_db()

# 2) This code sets up the MongoDB so that it can store our application's notes
mongo_client = pymongo.MongoClient("mongodb://localhost:27017/")
mongo_db     = mongo_client['loanPortal']
notes_coll   = mongo_db['application_notes']

# 3) This part will accept a new applicatiob by accepting name and address
@app.route('/api/accept_application', methods=['POST'])
def accept_application():
    data       = request.get_json()
    name       = data.get('name')
    address    = data.get('address')
    # This will inert the application into the sqlite database
    conn = sqlite3.connect(SQLITE_PATH)
    c    = conn.cursor()
    c.execute(
        "INSERT INTO applications (name, address, status) VALUES (?, ?, ?)",
        (name, address, 'received')
    )
    conn.commit()
    app_number = c.lastrowid
    conn.close()

    return jsonify({'applicationNumber': app_number, 'message': 'Application received'})

# 4) This chekcs the status of the program and returns the notees
@app.route('/api/check_status/<int:app_number>', methods=['GET'])
def check_status(app_number):
    # Status is fethed from SQlite
    conn = sqlite3.connect(SQLITE_PATH)
    c    = conn.cursor()
    c.execute("SELECT status FROM applications WHERE appNumber = ?", (app_number,))
    row = c.fetchone()
    conn.close()

    if not row:
        return jsonify({'message': 'Application not found'}), 404

    status = row[0]
    # This feteches the notes from Mongo
    notes = list(notes_coll.find(
        {'appNumber': app_number},
        {'_id': 0}
    ))
    # The notes are sorted by timestamp
    notes.sort(key=lambda n: n['timestamp'])

    return jsonify({'status': status, 'notes': notes})

# 5) This changes a status and addes a note to the mongo db
@app.route('/api/change_status', methods=['POST'])
def change_status():
    data       = request.get_json()
    app_number = data.get('appNumber')
    new_status = data.get('newStatus')

    # Updates the sqlite
    conn = sqlite3.connect(SQLITE_PATH)
    c    = conn.cursor()
    c.execute(
        "UPDATE applications SET status = ? WHERE appNumber = ?",
        (new_status, app_number)
    )
    updated = c.rowcount
    conn.commit()
    conn.close()

    if not updated:
        return jsonify({'message': 'Application not found'}), 404

    # Adds the new status to Mongo
    note = {
        'appNumber': app_number,
        'phase':     new_status,
        'message':   f"Status updated to {new_status}.",
        'timestamp': datetime.datetime.utcnow().isoformat()
    }
    notes_coll.insert_one(note)

    return jsonify({'message': f"Status updated to {new_status}"})

# 6) This is an arbitrary note template. The subphase is optional. 
@app.route('/api/add_note', methods=['POST'])
def add_note():
    data       = request.get_json()
    app_number = data.get('appNumber')
    phase      = data.get('phase')
    subphase   = data.get('subphase')  
    message    = data.get('message')

    # This makes sure the sqlitw has the spplication
    conn = sqlite3.connect(SQLITE_PATH)
    c    = conn.cursor()
    c.execute("SELECT 1 FROM applications WHERE appNumber = ?", (app_number,))
    exists = c.fetchone()
    conn.close()

    if not exists:
        return jsonify({'message': 'Application not found'}), 404

    # The note is put into MongoDB
    note = {
        'appNumber': app_number,
        'phase':     phase,
        'message':   message,
        'timestamp': datetime.datetime.utcnow().isoformat()
    }
    if subphase:
        note['subphase'] = subphase

    notes_coll.insert_one(note)
    return jsonify({'message': 'Note added successfully'})

# 7) Front end is loaded so we can rub the app
@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
