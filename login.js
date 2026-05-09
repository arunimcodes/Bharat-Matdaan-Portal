/* ── Bharat Matdaan Portal — Login Logic ── */

function setStep(n) {
  [1, 2, 3].forEach(i => {
    const stepEl = document.getElementById('step-' + i);
    if (stepEl) stepEl.classList.toggle('active', i === n);

    const dot = document.getElementById('step-dot-' + i);
    if (dot) {
      dot.classList.remove('active', 'done');
      if (i < n) { dot.classList.add('done'); dot.textContent = '✓'; }
      else if (i === n) { dot.classList.add('active'); dot.textContent = i; }
      else { dot.textContent = i; }
    }
  });

  [1, 2].forEach(i => {
    const line = document.getElementById('step-line-' + i);
    if (line) line.classList.toggle('done', i < n);
  });
  clearAlert();
}

function showAlert(msg, type = 'error') {
  const el = document.getElementById('alert-box');
  if (el) { el.textContent = msg; el.className = 'alert ' + type; }
}

function clearAlert() {
  const el = document.getElementById('alert-box');
  if (el) { el.className = 'alert'; el.textContent = ''; }
}

function goToStep1() { setStep(1); }

function goToStep2() {
  const name = document.getElementById('input-name').value.trim();
  if (!name || name.length < 3) {
    showAlert('Please enter your full name (at least 3 characters).');
    document.getElementById('input-name').classList.add('error-input');
    return;
  }
  document.getElementById('input-name').classList.remove('error-input');
  setStep(2);
}

function goToStep3() {
  const a1 = document.getElementById('aadhar-1').value.trim();
  const a2 = document.getElementById('aadhar-2').value.trim();
  const a3 = document.getElementById('aadhar-3').value.trim();
  if (!/^\d{12}$/.test(a1 + a2 + a3)) {
    showAlert('Aadhaar number must be exactly 12 digits.');
    return;
  }
  setStep(3);
}

async function doLogin() {
  const voterId   = document.getElementById('input-voter-id').value.trim().toUpperCase();
  const a1        = document.getElementById('aadhar-1').value.trim();
  const a2        = document.getElementById('aadhar-2').value.trim();
  const a3        = document.getElementById('aadhar-3').value.trim();
  const fullAadhar = a1 + a2 + a3;
  const nameInput = document.getElementById('input-name').value.trim();

  if (!/^[A-Z]{3}\d{7}$/.test(voterId)) {
    showAlert('Voter ID must be 3 letters followed by 7 digits (e.g. ABC1234567).');
    document.getElementById('input-voter-id').classList.add('error-input');
    return;
  }
  document.getElementById('input-voter-id').classList.remove('error-input');

  const btn = document.getElementById('login-btn');
  btn.textContent = 'Verifying with EC Records...';
  btn.classList.add('loading');
  btn.disabled = true;

  try {
    const response = await fetch('http://127.0.0.1:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aadhar: fullAadhar, voter_id: voterId, name: nameInput })
    });

    const data = await response.json();

    if (response.ok && data.status === 'success') {
      // ── KEY FIX: store the token returned by the server ──
      sessionStorage.setItem('voterToken', data.voter_token);
      sessionStorage.setItem('voterName',  data.name || nameInput);
      sessionStorage.setItem('voterEPIC',  voterId);
      sessionStorage.setItem('voterAadhar', fullAadhar);

      document.getElementById('success-name').textContent     = data.name || nameInput;
      document.getElementById('success-voter-id').textContent = voterId;
      document.getElementById('success-aadhar').textContent   = 'XXXX XXXX ' + a3;

      document.getElementById('steps-indicator').style.display = 'none';
      [1, 2, 3].forEach(i => document.getElementById('step-' + i).classList.remove('active'));
      document.getElementById('success-screen').classList.add('visible');
      clearAlert();
    } else {
      showAlert('Verification Failed: ' + (data.message || 'Unknown error'));
    }
  } catch (error) {
    showAlert('Network Error: Is the Python server running?');
  } finally {
    btn.textContent = 'Authenticate & Enter';
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

function proceedToVote() { window.location.href = 'voting.html'; }

function resetForm() {
  sessionStorage.clear();
  document.getElementById('success-screen').classList.remove('visible');
  document.getElementById('steps-indicator').style.display = '';
  document.getElementById('input-name').value = '';
  ['aadhar-1','aadhar-2','aadhar-3'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('input-voter-id').value = '';
  setStep(1);
}

document.addEventListener('DOMContentLoaded', () => {
  ['aadhar-1', 'aadhar-2'].forEach((id, idx) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '');
        if (this.value.length === 4)
          document.getElementById(['aadhar-2','aadhar-3'][idx]).focus();
      });
    }
  });

  const a3 = document.getElementById('aadhar-3');
  if (a3) a3.addEventListener('input', function () { this.value = this.value.replace(/\D/g, ''); });

  const vId = document.getElementById('input-voter-id');
  if (vId) vId.addEventListener('input', function () {
    this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  });

  document.getElementById('input-name').addEventListener('keydown',       e => { if (e.key === 'Enter') goToStep2(); });
  document.getElementById('aadhar-3').addEventListener('keydown',         e => { if (e.key === 'Enter') goToStep3(); });
  document.getElementById('input-voter-id').addEventListener('keydown',   e => { if (e.key === 'Enter') doLogin(); });
});