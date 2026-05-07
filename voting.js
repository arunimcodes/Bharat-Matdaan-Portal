/* ── Bharat Matdaan — Voting Logic (token-based auth) ── */

const PARTIES = [
  { id:'bjp',  name:'BJP',  full:'Bharatiya Janata Party',   symbol:'🪷', color:'#E87722', tag:'ruling',     tagLabel:'Ruling Alliance' },
  { id:'inc',  name:'INC',  full:'Indian National Congress',  symbol:'✋', color:'#19AAED', tag:'opposition', tagLabel:'Opposition' },
  { id:'aap',  name:'AAP',  full:'Aam Aadmi Party',           symbol:'🧹', color:'#00AEEF', tag:'regional',   tagLabel:'Regional' },
  { id:'sp',   name:'SP',   full:'Samajwadi Party',           symbol:'🚲', color:'#E31E24', tag:'regional',   tagLabel:'Regional' },
  { id:'nota', name:'NOTA', full:'None of the Above',         symbol:'✗',  color:'#888780', tag:'nota',       tagLabel:'NOTA' },
];

const STATES = [
  { name:'Uttar Pradesh',   seats:80 }, { name:'Maharashtra',    seats:48 },
  { name:'West Bengal',     seats:42 }, { name:'Bihar',          seats:40 },
  { name:'Tamil Nadu',      seats:39 }, { name:'Madhya Pradesh', seats:29 },
  { name:'Karnataka',       seats:28 }, { name:'Rajasthan',      seats:25 },
  { name:'Andhra Pradesh',  seats:25 }, { name:'Gujarat',        seats:26 },
  { name:'Odisha',          seats:21 }, { name:'Kerala',         seats:20 },
  { name:'Telangana',       seats:17 }, { name:'Jharkhand',      seats:14 },
  { name:'Assam',           seats:14 }, { name:'Punjab',         seats:13 },
  { name:'Chhattisgarh',    seats:11 }, { name:'Haryana',        seats:10 },
  { name:'Delhi',           seats:7  }, { name:'Uttarakhand',    seats:5  },
];

const CANDIDATE_NAMES = {
  bjp:  ['Narendra Singh','Amit Chandra','Rajnath Verma','Smriti Joshi','Yogi Devi'],
  inc:  ['Rahul Mehta','Priyanka Sharma','Sonia Bose','Mallikarjun Roy','Digvijay Nair'],
  aap:  ['Arvind Sinha','Manish Gupta','Atishi Kapoor','Raghav Das','Sandeep Pathak'],
  sp:   ['Akhilesh Pandey','Dimple Prasad','Ram Gopal Tiwari','Shivpal Kumar','Azam Ali'],
  nota: ['—','—','—','—','—'],
};

let CONSTITUENCIES  = [];
let votes           = {};
let currentConstIdx = 0;
let selectedParty   = null;
let confirming      = false;

// ── KEY FIX: read the token saved by login.js ──
const VOTER_TOKEN = sessionStorage.getItem('voterToken');

function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xFFFFFFFF; return (s >>> 0) / 0xFFFFFFFF; };
}

function buildConstituencies() {
  let idx = 0;
  STATES.forEach(s => {
    for (let i = 1; i <= s.seats; i++) {
      CONSTITUENCIES.push({ id: idx, state: s.name, name: s.name + ' — ' + i, num: i });
      idx++;
    }
  });
}

function simulateWinner(constId) {
  const rng = seededRandom(constId * 7 + 13);
  const weights = PARTIES.map(p => {
    let base = { bjp:0.37, inc:0.28, aap:0.07, sp:0.10, nota:0.03 }[p.id] || 0.05;
    return base + (rng() - 0.5) * 0.15;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  const norm  = weights.map(w => w / total);
  let win = 0;
  norm.forEach((v, i) => { if (v > norm[win]) win = i; });
  return PARTIES[win].id;
}

function getTally() {
  const tally = {};
  PARTIES.forEach(p => tally[p.id] = 0);
  CONSTITUENCIES.forEach(c => {
    const w = votes[c.id] !== undefined ? votes[c.id] : simulateWinner(c.id);
    tally[w]++;
  });
  return tally;
}

function getCandidateName(partyId, constId) {
  const names = CANDIDATE_NAMES[partyId] || CANDIDATE_NAMES.nota;
  return names[constId % names.length];
}

function renderSidebar() {
  const sb = document.getElementById('sidebar-states');
  if (!sb) return;
  sb.innerHTML = '';
  const votedSet = new Set(Object.keys(votes).map(Number));
  STATES.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'state-btn' + (CONSTITUENCIES[currentConstIdx]?.state === s.name ? ' active' : '');
    btn.onclick = () => jumpToState(s.name);
    const votedInState = CONSTITUENCIES.filter(c => c.state === s.name && votedSet.has(c.id)).length;
    btn.innerHTML = `<span>${s.name}</span><span class="seat-count">${votedInState}/${s.seats}</span>`;
    sb.appendChild(btn);
  });
}

function renderMain() {
  const c = CONSTITUENCIES[currentConstIdx];
  if (!c) return;

  document.getElementById('const-name-label').textContent  = c.name;
  document.getElementById('const-counter').textContent     = (currentConstIdx + 1) + ' / ' + CONSTITUENCIES.length;
  document.getElementById('prev-btn').disabled             = currentConstIdx === 0;
  document.getElementById('next-btn').disabled             = currentConstIdx === CONSTITUENCIES.length - 1;

  const totalVoted = Object.keys(votes).length;
  const pct = Math.round((totalVoted / CONSTITUENCIES.length) * 100);
  document.getElementById('progress-fill').style.width = pct + '%';

  const alreadyVoted = votes[c.id] !== undefined;
  const list = document.getElementById('candidates-list');
  list.innerHTML = '';

  PARTIES.forEach(p => {
    const card       = document.createElement('div');
    const isSelected = selectedParty === p.id;
    const isVoted    = alreadyVoted && votes[c.id] === p.id;
    card.className   = 'candidate-card' + (isSelected ? ' selected' : '') + (isVoted ? ' voted-for' : '');

    card.innerHTML = `
      ${isVoted ? '<div class="voted-ribbon">VOTED</div>' : ''}
      <div class="cand-symbol">${p.symbol}</div>
      <div class="cand-info">
        <div class="cand-party-name">${p.name}</div>
        <div class="cand-full-name">${p.full}${p.id !== 'nota' ? ' · ' + getCandidateName(p.id, c.id) : ''}</div>
        <div class="cand-tags"><span class="cand-tag tag-${p.tag}">${p.tagLabel}</span></div>
      </div>
      <div class="cand-radio"></div>
    `;
    if (!alreadyVoted) card.onclick = () => selectParty(p.id);
    list.appendChild(card);
  });
  updateVoteButton();
}

function selectParty(partyId) {
  selectedParty = partyId;
  confirming    = false;
  renderMain();
}

function updateVoteButton() {
  const c           = CONSTITUENCIES[currentConstIdx];
  const btn         = document.getElementById('cast-vote-btn');
  const preview     = document.getElementById('selected-preview');
  const alreadyVoted = votes[c.id] !== undefined;

  if (alreadyVoted) {
    btn.disabled    = true;
    btn.textContent = '✓ Vote Recorded';
    btn.className   = 'cast-vote-btn confirmed';
    const party     = PARTIES.find(p => p.id === votes[c.id]);
    preview.innerHTML = `You voted for <strong>${party.name}</strong>.`;
    return;
  }

  btn.disabled  = !selectedParty;
  btn.className = 'cast-vote-btn' + (confirming ? ' confirming' : '');

  if (!selectedParty) {
    btn.textContent   = 'Select a candidate to vote';
    preview.innerHTML = '';
  } else if (confirming) {
    btn.textContent   = `⚡ Confirm Vote for ${selectedParty.toUpperCase()}`;
    preview.innerHTML = `Tap again to confirm your selection.`;
  } else {
    btn.textContent   = `Cast Vote for ${selectedParty.toUpperCase()}`;
    preview.innerHTML = `Selected: <strong>${selectedParty.toUpperCase()}</strong>`;
  }
}

function handleVoteClick() {
  if (!selectedParty) return;
  const c = CONSTITUENCIES[currentConstIdx];

  if (!confirming) {
    confirming = true;
    updateVoteButton();
    return;
  }

  // ── KEY FIX: send voter_token in the request body — no cookies needed ──
  fetch('http://127.0.0.1:5000/api/cast-vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      candidate_id: selectedParty,
      voter_token:  VOTER_TOKEN          // <── this is the fix
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === 'success') {
      votes[c.id] = selectedParty;
      confirming  = false;
      showToast('✓ Vote SECURED in Central Database', 'success');
      renderMain();
      renderSidebar();
      renderResults();

      if (currentConstIdx < CONSTITUENCIES.length - 1) {
        setTimeout(() => {
          currentConstIdx++;
          selectedParty = null;
          renderMain();
          renderSidebar();
        }, 600);
      }
    } else {
      confirming = false;
      updateVoteButton();
      showToast('❌ ' + (data.message || 'Vote failed'), 'error');
    }
  })
  .catch(() => {
    confirming = false;
    updateVoteButton();
    showToast('Server error. Check if vote.py is running.', 'error');
  });
}

function renderResults() {
  const tally  = getTally();
  const sorted = [...PARTIES].sort((a, b) => tally[b.id] - tally[a.id]);
  const totalVoted = Object.keys(votes).length;

  document.getElementById('votes-cast').textContent      = totalVoted;
  document.getElementById('seats-remaining').textContent = 543 - totalVoted;

  const grid = document.getElementById('parliament-grid');
  if (!grid) return;
  grid.innerHTML = '';
  CONSTITUENCIES.forEach(c => {
    const w     = votes[c.id] !== undefined ? votes[c.id] : simulateWinner(c.id);
    const party = PARTIES.find(p => p.id === w);
    const dot   = document.createElement('div');
    dot.className      = 'seat-dot';
    dot.style.background = party.color;
    grid.appendChild(dot);
  });

  const barList = document.getElementById('party-bar-list');
  if (barList) {
    barList.innerHTML = sorted.map(p => {
      const pct = Math.round((tally[p.id] / 543) * 100);
      return `
        <div class="party-bar-row">
          <div class="party-bar-header">
            <div class="party-bar-name"><span>${p.symbol}</span> ${p.name}</div>
            <div class="party-bar-seats">${tally[p.id]}</div>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${p.color};"></div></div>
        </div>`;
    }).join('');
  }
}

function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast       = document.createElement('div');
  toast.className   = 'toast-item ' + type;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

function setVoterInfo() {
  document.getElementById('voter-name-display').textContent = sessionStorage.getItem('voterName') || 'Demo Voter';
  document.getElementById('voter-epic-display').textContent = sessionStorage.getItem('voterEPIC')  || 'IND0000000';
}

function jumpToState(stateName) {
  const idx = CONSTITUENCIES.findIndex(c => c.state === stateName);
  if (idx !== -1) { currentConstIdx = idx; selectedParty = null; renderMain(); renderSidebar(); }
}

function prevConst() {
  if (currentConstIdx > 0) { currentConstIdx--; selectedParty = null; renderMain(); renderSidebar(); }
}
function nextConst() {
  if (currentConstIdx < CONSTITUENCIES.length - 1) { currentConstIdx++; selectedParty = null; renderMain(); renderSidebar(); }
}
function logout() { sessionStorage.clear(); window.location.href = 'login.html'; }

// ── Init ──
buildConstituencies();
setVoterInfo();
renderSidebar();
renderMain();
renderResults();