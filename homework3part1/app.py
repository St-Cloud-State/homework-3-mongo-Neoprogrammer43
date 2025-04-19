from flask import Flask, jsonify, render_template, request
from flask_pymongo import PyMongo
import datetime

app = Flask(__name__)

# MongoDB configuration
app.config["MONGO_URI"] = "mongodb://localhost:27017/loanPortal"  # Adjust URI if using MongoDB Atlas
mongo = PyMongo(app)

# Accept a new application
@app.route('/api/accept_application', methods=['POST'])
def accept_application():
    data = request.get_json()
    name = data.get('name')
    zip_code = data.get('zipCode')

    # Generate application number (based on the number of documents in the collection)
    app_number = mongo.db.applications.count_documents({}) + 1

    # Create a new application document
    new_application = {
        'appNumber': app_number,
        'name': name,
        'zipCode': zip_code,
        'status': 'received',  # Default status
        'notes': []  # Initialize an empty list for notes
    }

    # Insert the new application into MongoDB
    mongo.db.applications.insert_one(new_application)

    return jsonify({'applicationNumber': app_number, 'message': 'Application received'})

# Check the status of an application
@app.route('/api/check_status/<int:app_number>', methods=['GET'])
def check_status(app_number):
    # Find the application in MongoDB by application number
    application = mongo.db.applications.find_one({"appNumber": app_number})
    if application:
        return jsonify({'status': application['status'], 'notes': application['notes']})
    else:
        return jsonify({'message': 'Application not found'}), 404

# Update the status of an application and add notes
@app.route('/api/change_status', methods=['POST'])
def change_status():
    data = request.get_json()
    app_number = data.get('appNumber')
    new_status = data.get('newStatus')

    # Find the application in MongoDB by application number
    application = mongo.db.applications.find_one({"appNumber": app_number})
    if application:
        # Update the status and add a note to the notes array
        mongo.db.applications.update_one(
            {"appNumber": app_number},
            {
                "$set": {"status": new_status},  # Update the status
                "$push": {
                    "notes": {
                        "phase": new_status,
                        "message": f"Status updated to {new_status}.",
                        "timestamp": datetime.datetime.now().isoformat()  # Add the current timestamp
                    }
                }
            }
        )
        return jsonify({'message': f"Status updated to {new_status}"})
    else:
        return jsonify({'message': 'Application not found'}), 404

# Route to render the index.html page
@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0")
