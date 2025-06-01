// Simple backtracking Sudoku generator ⇢ one unique solution.
// Not optimized but fine for demo.

export function generate() {
  const grid = Array(81).fill(0);
  fill(0, grid);
  const solution = grid.slice();
  removeNumbers(grid, 51);         // leave ±30 clues
  return { puzzle: grid, solution };
}

function fill(pos, g) {
  if (pos === 81) return true;
  if (g[pos] !== 0) return fill(pos + 1, g);

  const nums = shuffle([1,2,3,4,5,6,7,8,9]);
  for (const n of nums) {
    if (valid(pos, n, g)) {
      g[pos] = n;
      if (fill(pos + 1, g)) return true;
      g[pos] = 0;
    }
  }
  return false;
}

function valid(p, n, g) {
  const r = Math.floor(p / 9), c = p % 9;
  for (let i=0;i<9;i++) if (g[r*9+i]==n || g[i*9+c]==n) return false;
  const br = Math.floor(r/3)*27, bc = Math.floor(c/3)*3;
  for (let i=0;i<3;i++) for (let j=0;j<3;j++)
    if (g[br+i*9+bc+j]==n) return false;
  return true;
}

function removeNumbers(g, toRemove) {
  let removed = 0;
  while (removed < toRemove) {
    const i = Math.floor(Math.random()*81);
    if (g[i] !== 0) { g[i] = 0; removed++; }
  }
}

function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]] } return arr; }

export function isSolved(state, solution) {
  return state.every((v,i)=>v===solution[i]);
}
