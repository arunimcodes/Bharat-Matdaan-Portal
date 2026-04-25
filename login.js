/* ── Bharat Matdaan Portal — Login Logic ── */

function setStep(n) {
  [1,2,3].forEach(i => {
    document.getElementById('step-' + i).classList.toggle('active', i === n);
    const dot = document.getElementById('step-dot-' + i);
    dot.classList.remove('active','done');
    if (i < n) { dot.classList.add('done'); dot.textContent = '✓'; }
    else if (i === n) { dot.classList.add('active'); dot.textContent = i; }
    else { dot.textContent = i; }
  });
  [1,2].forEach(i => {
    document.getElementById('step-line-' + i).classList.toggle('done', i < n);
  });
  clearAlert();
}

function showAlert(msg, type = 'error') {
  const el = document.getElementById('alert-box');
  el.textContent = msg;
  el.className = 'alert ' + type;
}

function clearAlert() {
  const el = document.getElementById('alert-box');
  el.className = 'alert';
  el.textContent = '';
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
  const full = a1 + a2 + a3;
  if (!/^\d{12}$/.test(full)) {
    showAlert('Aadhaar number must be exactly 12 digits.');
    return;
  }
  setStep(3);
}

function doLogin() {
  const voterId = document.getElementById('input-voter-id').value.trim().toUpperCase();
  if (!/^[A-Z]{3}\d{7}$/.test(voterId)) {
    showAlert('Voter ID must be 3 letters followed by 7 digits (e.g. ABC1234567).');
    document.getElementById('input-voter-id').classList.add('error-input');
    return;
  }
  document.getElementById('input-voter-id').classList.remove('error-input');

  const btn = document.getElementById('login-btn');
  btn.textContent = 'Verifying...';
  btn.classList.add('loading');
  btn.disabled = true;

  setTimeout(() => {
    btn.textContent = 'Authenticate & Enter';
    btn.classList.remove('loading');
    btn.disabled = false;

    const name = document.getElementById('input-name').value.trim();
    const a3   = document.getElementById('aadhar-3').value.trim();
    const masked = 'XXXX XXXX ' + a3;

    document.getElementById('success-name').textContent = name;
    document.getElementById('success-voter-id').textContent = voterId;
    document.getElementById('success-aadhar').textContent = masked;

    document.getElementById('steps-indicator').style.display = 'none';
    [1,2,3].forEach(i => document.getElementById('step-' + i).classList.remove('active'));
    document.getElementById('success-screen').classList.add('visible');
    clearAlert();

    // Store voter info for the voting page
    sessionStorage.setItem('voterName', name);
    sessionStorage.setItem('voterEPIC', voterId);
  }, 1800);
}

function resetForm() {
  ['input-name','input-voter-id'].forEach(id => document.getElementById(id).value = '');
  ['aadhar-1','aadhar-2','aadhar-3'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('success-screen').classList.remove('visible');
  document.getElementById('steps-indicator').style.display = 'flex';
  setStep(1);
}

function proceedToVote() {
  window.location.href = 'voting.html';
}

// Aadhaar auto-tab & digit-only
['aadhar-1','aadhar-2'].forEach((id, idx) => {
  document.getElementById(id).addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '');
    if (this.value.length === 4) {
      document.getElementById(['aadhar-2','aadhar-3'][idx]).focus();
    }
  });
});
document.getElementById('aadhar-3').addEventListener('input', function () {
  this.value = this.value.replace(/\D/g, '');
});

document.getElementById('input-voter-id').addEventListener('input', function () {
  this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
});

// Enter key navigation
document.getElementById('input-name').addEventListener('keydown', e => { if (e.key === 'Enter') goToStep2(); });
document.getElementById('aadhar-3').addEventListener('keydown', e => { if (e.key === 'Enter') goToStep3(); });
document.getElementById('input-voter-id').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
