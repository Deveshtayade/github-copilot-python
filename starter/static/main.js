// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
const LEADERBOARD_KEY = 'sudoku-leaderboard';
const THEME_KEY = 'sudoku-theme';
let puzzle = [];
let timerInterval = null;
let elapsedSeconds = 0;
let isSolved = false;
let currentDifficulty = 'easy';

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function updateTimerDisplay() {
  const timerElement = document.getElementById('timer');
  if (timerElement) {
    timerElement.textContent = `Time: ${formatTime(elapsedSeconds)}`;
  }
}

function startTimer() {
  stopTimer();
  elapsedSeconds = 0;
  updateTimerDisplay();
  timerInterval = window.setInterval(() => {
    elapsedSeconds += 1;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }
}

function resetTimer() {
  stopTimer();
  elapsedSeconds = 0;
  updateTimerDisplay();
}

function getLeaderboard() {
  try {
    const stored = localStorage.getItem(LEADERBOARD_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

function saveLeaderboard(entries) {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
}

function renderLeaderboard() {
  const list = document.getElementById('leaderboard-list');
  if (!list) {
    return;
  }

  const scores = getLeaderboard().slice(0, 10);
  if (scores.length === 0) {
    list.innerHTML = '<li>No completed games yet.</li>';
    return;
  }

  list.innerHTML = scores
    .map((entry, index) => {
      const timeText = `${String(Math.floor(entry.time / 60)).padStart(2, '0')}:${String(entry.time % 60).padStart(2, '0')}`;
      return `<li>#${index + 1} ${entry.name} — ${timeText} — ${entry.difficulty}</li>`;
    })
    .join('');
}

function addScoreToLeaderboard(name, time, difficulty) {
  const scores = getLeaderboard();
  scores.push({ name, time, difficulty });
  scores.sort((a, b) => a.time - b.time);
  saveLeaderboard(scores.slice(0, 10));
  renderLeaderboard();
}

function isTopTenScore(time) {
  const scores = getLeaderboard();
  return scores.length < 10 || time < scores[scores.length - 1].time;
}

function showCompletionPopup(time) {
  const timeText = `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;
  const message = `Congratulations! You solved the puzzle in ${timeText}.`;

  if (window.confirm(`${message}\n\nWould you like to save this score to the leaderboard?`)) {
    const playerName = window.prompt('Enter your name for the leaderboard:', 'Player');
    if (playerName && playerName.trim()) {
      addScoreToLeaderboard(playerName.trim(), time, currentDifficulty);
    }
  }
}

function applyTheme(theme) {
  document.body.classList.toggle('dark-mode', theme === 'dark');
  const toggleButton = document.getElementById('theme-toggle');
  if (toggleButton) {
    toggleButton.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
  }
}

function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(savedTheme);
}

function toggleTheme() {
  const isDark = document.body.classList.contains('dark-mode');
  const nextTheme = isDark ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, nextTheme);
  applyTheme(nextTheme);
}

function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';
  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = 'sudoku-cell';
      input.dataset.row = i;
      input.dataset.col = j;
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function renderPuzzle(puz) {
  puzzle = puz;
  createBoardElement();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      if (val !== 0) {
        inp.value = val;
        inp.disabled = true;
        inp.className += ' prefilled';
      } else {
        inp.value = '';
        inp.disabled = false;
      }
    }
  }
}

async function newGame() {
  currentDifficulty = document.getElementById('difficulty-select').value;
  const res = await fetch(`/new?difficulty=${currentDifficulty}`);
  const data = await res.json();
  renderPuzzle(data.puzzle);
  isSolved = false;
  startTimer();
  document.getElementById('message').innerText = '';
}

function getBoardFromInputs() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = [];

  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const value = inputs[idx].value;
      board[i][j] = value ? parseInt(value, 10) : 0;
    }
  }

  return board;
}

function applyHintToBoard(row, col, value) {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const idx = row * SIZE + col;
  const input = inputs[idx];

  if (!input || input.disabled) {
    return false;
  }

  input.value = value;
  input.disabled = true;
  input.className = 'sudoku-cell prefilled hint-cell';
  return true;
}

function updateIncorrectHighlights(incorrectIndexes) {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');

  for (let idx = 0; idx < inputs.length; idx++) {
    const input = inputs[idx];
    if (input.disabled) {
      continue;
    }

    const classes = input.className
      .split(/\s+/)
      .filter(Boolean)
      .filter((cls) => cls !== 'incorrect');

    input.className = classes.join(' ');
    if (incorrectIndexes.has(idx)) {
      input.className = `${input.className} incorrect`.trim();
    }
  }
}

async function checkSolution() {
  const board = getBoardFromInputs();
  const res = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  const msg = document.getElementById('message');
  if (data.error) {
    msg.style.color = '#d32f2f';
    msg.innerText = data.error;
    return;
  }
  const incorrect = new Set(data.incorrect.map((x) => x[0] * SIZE + x[1]));
  updateIncorrectHighlights(incorrect);

  if (incorrect.size === 0) {
    isSolved = true;
    stopTimer();
    if (isTopTenScore(elapsedSeconds)) {
      showCompletionPopup(elapsedSeconds);
    } else {
      window.alert(`Congratulations! You solved the puzzle in ${formatTime(elapsedSeconds)}.`);
    }
    msg.style.color = '#388e3c';
    msg.innerText = 'Congratulations! You solved it!';
  } else {
    msg.style.color = '#d32f2f';
    msg.innerText = 'Some cells are incorrect.';
  }
}

async function requestHint() {
  const board = getBoardFromInputs();
  const res = await fetch('/hint', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });

  const data = await res.json();
  const msg = document.getElementById('message');

  if (data.error) {
    msg.style.color = '#d32f2f';
    msg.innerText = data.error;
    return;
  }

  if (!data.hint) {
    msg.style.color = '#d32f2f';
    msg.innerText = 'No empty cells available for a hint.';
    return;
  }

  applyHintToBoard(data.hint.row, data.hint.col, data.hint.value);
  msg.style.color = '#1976d2';
  msg.innerText = 'Hint used.';
}

// Wire buttons
window.addEventListener('load', () => {
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('hint').addEventListener('click', requestHint);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  document.getElementById('difficulty-select').addEventListener('change', newGame);
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  loadTheme();
  updateTimerDisplay();
  renderLeaderboard();
  newGame();
});