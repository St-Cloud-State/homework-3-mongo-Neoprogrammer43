// static/script.js

// 1) Submit a new application (name + address)
function acceptApplication() {
    const name    = document.getElementById('applicantName').value;
    const address = document.getElementById('address').value;        // ← changed
  
    fetch('/api/accept_application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, address })                        // ← changed
    })
      .then(res => res.json())
      .then(data => {
        document.getElementById('confirmationMessage').innerText =
          `Application received! Your number is ${data.applicationNumber}.`;
      })
      .catch(err => console.error('Error submitting application:', err));
  }
  
  
  
  // 2) Check application status
  function checkStatus() {
    const appNumber = document.getElementById('checkAppNumber').value;
    fetch(`/api/check_status/${appNumber}`)
      .then(res => res.json())
      .then(data => {
        const statusMessage = document.getElementById('statusMessage');
        if (data.status) {
          statusMessage.innerText = `Status for Application ${appNumber}: ${data.status}`;
        } else {
          statusMessage.innerText = `Application Number ${appNumber} not found.`;
        }
      })
      .catch(err => console.error('Error checking application status:', err));
  }
  
  // 3) Update application status (admin)
  function updateStatus(statusCode) {
    const appNumber = parseInt(document.getElementById('changeAppNumber').value, 10);
    const statusOptions = ['received', 'processing', 'accepted', 'rejected'];
    const newStatus = statusOptions[statusCode - 1];
  
    fetch('/api/change_status', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({appNumber, newStatus})
    })
    .then(res => res.json())
    .then(data => {
      document.getElementById('changeStatusMessage').innerText = data.message;
    })
    .catch(err => console.error('Error updating application status:', err));
  }
  
  // 4.1) Initial Info Note
  function addInitialNote() {
    const appNumber = parseInt(document.getElementById('note1AppNumber').value, 10);
    const name      = document.getElementById('note1Name').value;
    const zipCode   = document.getElementById('note1ZipCode').value;
    const message   = `Name: ${name}, Zip Code: ${zipCode}`;
  
    fetch('/api/add_note', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({appNumber, phase:'initial', message})
    })
    .then(res => res.json())
    .then(data => {
      document.getElementById('note1Message').innerText = data.message;
    })
    .catch(err => console.error('Error adding initial note:', err));
  }
  
  // 4.2) Processing Subphase Notes
  function addProcessingNotes() {
    const appNumber = parseInt(document.getElementById('note2AppNumber').value, 10);
  
    // define each task under its subphase
    const tasks = [
      { subphase: 'personal_details',    label: 'ID check',                    value: document.getElementById('note2PersonalID').value },
      { subphase: 'personal_details',    label: 'Address check',               value: document.getElementById('note2PersonalAddress').value },
      { subphase: 'personal_details',    label: 'Background check',            value: document.getElementById('note2PersonalBackground').value },
  
      { subphase: 'credit',              label: 'Verify SSN',                  value: document.getElementById('note2CreditSSN').value },
      { subphase: 'credit',              label: 'Bureau communication',        value: document.getElementById('note2CreditBureau').value },
      { subphase: 'credit',              label: 'Final credit score',          value: document.getElementById('note2CreditScore').value },
  
      { subphase: 'certification',       label: 'Identify certifications',     value: document.getElementById('note2CertIdentify').value },
      { subphase: 'certification',       label: 'Records communication',       value: document.getElementById('note2CertCommunicate').value },
      { subphase: 'certification',       label: 'Final certification status',  value: document.getElementById('note2CertStatus').value }
    ];
  
    // make one call per non-empty status
    const calls = tasks
      .filter(t => t.value)
      .map(t =>
        fetch('/api/add_note', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appNumber,
            phase: 'processing',
            subphase: t.subphase,
            message: `${t.label}: ${t.value}`
          })
        })
      );
  
    if (calls.length === 0) {
      document.getElementById('note2Message').innerText = 'No statuses entered.';
      return;
    }
  
    Promise.all(calls)
      .then(() => {
        document.getElementById('note2Message').innerText = 'Processing task statuses added.';
      })
      .catch(err => {
        console.error('Error adding processing statuses:', err);
        document.getElementById('note2Message').innerText = 'Error adding notes.';
      });
  }
  
  
  // 4.3) Accepted Note
  function addAcceptedNote() {
    const appNumber    = parseInt(document.getElementById('note3AppNumber').value, 10);
    const loanTerms    = document.getElementById('note3LoanTerms').value;
    const interestRate = document.getElementById('note3InterestRate').value;
    const endYear      = document.getElementById('note3EndYear').value;
  
    const message = 
      `Loan terms: ${loanTerms}; Interest rate: ${interestRate}; End year: ${endYear}`;
  
    fetch('/api/add_note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appNumber,
        phase: 'accepted',
        message
      })
    })
    .then(res => res.json())
    .then(data => {
      document.getElementById('note3Message').innerText = data.message;
    })
    .catch(err => console.error('Error adding accepted note:', err));
  }
  
  
  // 4.4) Rejected Note
  function addRejectedNote() {
    const appNumber = parseInt(document.getElementById('note4AppNumber').value, 10);
    const message   = document.getElementById('note4Reason').value;
  
    fetch('/api/add_note', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({appNumber, phase:'rejected', message})
    })
    .then(res => res.json())
    .then(data => {
      document.getElementById('note4Message').innerText = data.message;
    })
    .catch(err => console.error('Error adding rejected note:', err));
  }
  
  // 4.5) View All Notes
  function viewAllNotes() {
    const appNumber = parseInt(document.getElementById('note5AppNumber').value, 10);
    fetch(`/api/check_status/${appNumber}`)
      .then(res => res.json())
      .then(data => {
        const out = document.getElementById('note5Output');
        if (data.notes) {
          let html = '<ul>';
          data.notes.forEach(n => {
            html += `<li>[${n.timestamp}] Phase: ${n.phase}` +
                    (n.subphase ? `/${n.subphase}` : '') +
                    ` – ${n.message}</li>`;
          });
          html += '</ul>';
          out.innerHTML = html;
        } else {
          out.innerText = 'Application not found.';
        }
      })
      .catch(err => console.error('Error viewing notes:', err));
  }
  