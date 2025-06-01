import { generate, isSolved } from './generator.js';

const boardElem   = document.getElementById('board');
const timerBox    = document.getElementById('timer');
const diffSelect  = document.getElementById('difficulty');
const newBtn      = document.getElementById('newGame');
const giveUpBtn   = document.getElementById('giveUp');

let state, solution, givenMask, secondsLeft, interval;

/* ---------- helpers ---------- */
const fmt = s => {
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  return `${m}:${ss}`;
};
const sessionId = new URLSearchParams(location.search).get('session');

/* ---------- game setup ---------- */
function newGame() {
  clearInterval(interval);                 // stop any old timer
  ({ puzzle: state, solution } = generate(diffSelect.value));
  givenMask  = state.map(v => v !== 0);
  secondsLeft = 25 * 60;
  buildBoard();
  timerBox.textContent = fmt(secondsLeft);

  interval = setInterval(tick, 1_000);
}

/* ---------- board rendering ---------- */
function buildBoard() {
  boardElem.innerHTML = '';                // wipe previous table
  for (let r = 0; r < 9; r++) {
    const tr = boardElem.insertRow();
    for (let c = 0; c < 9; c++) {
      const td  = tr.insertCell();
      const idx = r * 9 + c;
      if (givenMask[idx]) {                // original clue
        td.textContent = state[idx];
        td.classList.add('given');
      } else {                             // blank – make it <input>
        const inp = document.createElement('input');
        inp.className = 'cell';
        inp.maxLength = 1;
        inp.inputMode = 'numeric';
        inp.addEventListener('input', () => onInput(inp, idx));
        td.appendChild(inp);
      }
    }
  }
}

/* ---------- user typing ---------- */
function onInput(inp, idx) {
  const v = parseInt(inp.value, 10);
  state[idx] = (v >= 1 && v <= 9) ? v : 0;
  validate();
  if (isSolved(state, solution)) pass();
}

function validate() {
  // strip all invalid highlights
  document.querySelectorAll('#board td').forEach(td => td.classList.remove('invalid'));

  for (let i = 0; i < 81; i++) {
    if (state[i] === 0) continue;
    if (!cellValid(i, state[i])) {
      const td = boardElem.rows[Math.floor(i / 9)].cells[i % 9];
      td.classList.add('invalid');
    }
  }
}
function cellValid(p, n) {
  const r = Math.floor(p / 9), c = p % 9;
  for (let i = 0; i < 9; i++) {
    if (i !== c && state[r * 9 + i] === n) return false;
    if (i !== r && state[i * 9 + c] === n) return false;
  }
  const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const ii = (br + i) * 9 + (bc + j);
    if (ii !== p && state[ii] === n) return false;
  }
  return true;
}

/* ---------- timer & clue disappearance ---------- */
function tick() {
  secondsLeft--;
  timerBox.textContent = fmt(secondsLeft);

  if (secondsLeft % 60 === 0) dropClues(2);
  if (secondsLeft <= 0)            fail();
}

function dropClues(n) {
  let removed = 0;
  while (removed < n) {
    const i = Math.floor(Math.random() * 81);
    if (givenMask[i] && state[i] !== 0) {
      state[i] = 0;
      givenMask[i] = false;
      const td = boardElem.rows[Math.floor(i / 9)].cells[i % 9];
      td.textContent = '';
      const inp = document.createElement('input');
      inp.className = 'cell';
      inp.maxLength = 1;
      inp.inputMode = 'numeric';
      inp.addEventListener('input', () => onInput(inp, i));
      td.appendChild(inp);
      removed++;
    }
  }
}

/* ---------- outcome ---------- */
function pass() {
  clearInterval(interval);
  alert('Well done! −30 min.');
  sendAction('REMOVE_TIME', 30 * 60);
}
function fail() {
  clearInterval(interval);
  alert('Denied! +45 min.');
  sendAction('ADD_TIME', 45 * 60);
}
async function sendAction(type, secs) {
  if (!sessionId) { console.log('[demo] would send', type, secs); return; }
  await fetch(`https://api.chaster.app/extensions/sessions/${sessionId}/actions`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ type, duration: secs })
  });
}

/* ---------- wire-up ---------- */
newBtn   .addEventListener('click', newGame);
giveUpBtn.addEventListener('click', fail);
newGame();                               // start first puzzle on load

