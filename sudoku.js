import { generate, isSolved } from './generator.js';

const { puzzle, solution } = generate();
const state = puzzle.slice();   // copy
let secondsLeft = 25*60;
const givenMask = puzzle.map(v => v!==0);

const board = document.getElementById('board');
const timerBox = document.getElementById('timer');

// Build table
for (let r=0;r<9;r++){
  const tr = board.insertRow();
  for (let c=0;c<9;c++){
    const td = tr.insertCell();
    const idx = r*9+c;
    if (puzzle[idx]){
      td.textContent = puzzle[idx];
      td.classList.add('given');
    } else {
      td.addEventListener('click', () => edit(td, idx));
    }
  }
}

function edit(td, idx){
  const n = prompt("Enter 1–9 (blank to erase):");
  if (n===null) return;
  const v = parseInt(n,10);
  state[idx] = (v>=1 && v<=9) ? v : 0;
  td.textContent = state[idx] || '';
  validate();
}

function validate(){
  document.querySelectorAll('#board td').forEach(td=>td.classList.remove('invalid'));
  for (let i=0;i<81;i++){
    if (state[i]===0) continue;
    if (!cellValid(i, state[i])) {
      board.rows[Math.floor(i/9)].cells[i%9].classList.add('invalid');
    }
  }
}

function cellValid(p, n){
  const r=Math.floor(p/9),c=p%9;
  for(let i=0;i<9;i++){
    if(i!==c&&state[r*9+i]===n) return false;
    if(i!==r&&state[i*9+c]===n) return false;
  }
  const br=Math.floor(r/3)*3,bc=Math.floor(c/3)*3;
  for(let i=0;i<3;i++)for(let j=0;j<3;j++){
    const ii=(br+i)*9+(bc+j);
    if(ii!==p&&state[ii]===n) return false;
  }
  return true;
}

// Timer + clue removal
const interval = setInterval(()=>{
  secondsLeft--;
  timerBox.textContent = fmt(secondsLeft);

  // every 60 s remove 2 original clues that are still present
  if (secondsLeft%60===0) dropClues(2);

  if (secondsLeft<=0)                 return fail();
  if (isSolved(state, solution))      return pass();
},1000);

document.getElementById('giveUp').onclick = fail;

function dropClues(n){
  let removed=0;
  while(removed<n){
    const i=Math.floor(Math.random()*81);
    if(givenMask[i] && state[i]!==0){
      state[i]=0; givenMask[i]=false; removed++;
      const td = board.rows[Math.floor(i/9)].cells[i%9];
      td.textContent='';
      td.classList.remove('given');
      td.addEventListener('click',()=>edit(td,i));
    }
  }
}

function pass(){
  clearInterval(interval);
  alert('Well done! −30 min.');
  sendAction('REMOVE_TIME',30*60);
}
function fail(){
  clearInterval(interval);
  alert('Denied! +45 min.');
  sendAction('ADD_TIME',45*60);
}

function fmt(s){const m=Math.floor(s/60);const ss=(s%60).toString().padStart(2,'0');return `${m}:${ss}`;}

async function sendAction(type,secs){
  // Session ID is supplied by Chaster as ?session=...
  const params = new URLSearchParams(location.search);
  const session = params.get('session');
  if(!session){ console.warn('No session param—running standalone.'); return;}
  await fetch(`https://api.chaster.app/extensions/sessions/${session}/actions`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ type, duration:secs })
  });
}
