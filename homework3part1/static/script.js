// Array to store applications (this will be replaced with data from the server)
const applications = [];

// Function to accept a user's application and send it to the server
function acceptApplication() {
    const name = document.getElementById('applicantName').value;
    const zipCode = document.getElementById('zipCode').value;

    // Create the application data to send to the server
    const applicationData = {
        name: name,
        zipCode: zipCode
    };

    // Send the application data to the server via POST request
    fetch('/api/accept_application', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(applicationData)
    })
        .then(response => response.json())
        .then(data => {
            // Handle success (show confirmation with application number)
            const confirmationMessage = document.getElementById('confirmationMessage');
            confirmationMessage.innerHTML = `The Application Has Been Successfully Received. Your Application Number is: ${data.applicationNumber}`;
        })
        .catch(error => {
            console.error('Error submitting application:', error);
        });
}

// Function to check the status of an application
function checkStatus() {
    const appNumber = document.getElementById('checkAppNumber').value;

    // Send GET request to check application status
    fetch(`/api/check_status/${appNumber}`)
        .then(response => response.json())
        .then(data => {
            const statusMessage = document.getElementById('statusMessage');
            if (data.status) {
                statusMessage.innerHTML = `Status for Application ${appNumber}: ${data.status}`;
            } else {
                statusMessage.innerHTML = `Application Number ${appNumber} not found.`;
            }
        })
        .catch(error => {
            console.error('Error checking application status:', error);
        });
}

// Function to update the status of an application
function updateStatus(statusCode) {
    const appNumber = parseInt(document.getElementById('changeAppNumber').value, 10);  // Convert to integer
    const statusOptions = ['received', 'processing', 'accepted', 'rejected'];
    const newStatus = statusOptions[statusCode - 1]; // Maps the status code to status

    const statusData = {
        appNumber: appNumber,
        newStatus: newStatus
    };

    // Send the new status to the server via POST request
    fetch('/api/change_status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(statusData)
    })
        .then(response => response.json())
        .then(data => {
            const changeStatusMessage = document.getElementById('changeStatusMessage');
            changeStatusMessage.innerHTML = data.message;
        })
        .catch(error => {
            console.error('Error updating application status:', error);
        });
}
