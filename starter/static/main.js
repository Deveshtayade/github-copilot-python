// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
const LEADERBOARD_KEY = 'sudoku-leaderboard';
const THEME_KEY = 'sudoku-theme';
let puzzle = [];
let solution = [];
let timerInterval = null;
let elapsedSeconds = 0;
let isSolved = false;
let currentDifficulty = 'easy';
let hintsUsed = 0;

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
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    return parsed.map((entry) => ({
      ...entry,
      hintsUsed: typeof entry.hintsUsed === 'number' ? entry.hintsUsed : 0
    }));
  } catch (error) {
    return [];
  }
}

function saveLeaderboard(entries) {
  const normalizedEntries = entries.map((entry) => ({
    ...entry,
    hintsUsed: typeof entry.hintsUsed === 'number' ? entry.hintsUsed : 0
  }));
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(normalizedEntries));
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
      const hints = typeof entry.hintsUsed === 'number' ? entry.hintsUsed : 0;
      return `<li>#${index + 1} ${entry.name} — ${timeText} — ${entry.difficulty} — Hints: ${hints}</li>`;
    })
    .join('');
}

function addScoreToLeaderboard(name, time, difficulty) {
  const scores = getLeaderboard();
  scores.push({ name, time, difficulty, hintsUsed });
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

function isCellValueCorrect(row, col, value) {
  // This is the single source of truth for Sudoku cell correctness. Every
  // validation path uses it so the rules stay consistent in one place.
  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue < 1 || numericValue > SIZE) {
    return false;
  }

  return Array.isArray(solution) &&
    solution[row] &&
    typeof solution[row][col] === 'number' &&
    numericValue === solution[row][col];
}

function updateInputValidation(input, shouldMarkEmptyAsIncorrect = false) {
  if (!input || input.disabled) {
    // Keep locked and prefilled cells free of the temporary incorrect styling.
    input?.classList.remove('incorrect');
    return true;
  }

  const value = input.value;
  if (!value) {
    // Empty cells are only flagged during the explicit check action; live typing
    // should keep them neutral until the user has entered a value.
    if (shouldMarkEmptyAsIncorrect) {
      input.classList.add('incorrect');
    } else {
      input.classList.remove('incorrect');
    }
    return !shouldMarkEmptyAsIncorrect;
  }

  const row = Number(input.dataset.row);
  const col = Number(input.dataset.col);

  // Reuse the shared helper so live typing and the check-button path follow the
  // same validation rules.
  const isCorrect = isCellValueCorrect(row, col, value);

  if (!isCorrect) {
    input.classList.add('incorrect');
  } else {
    input.classList.remove('incorrect');
  }
  return isCorrect;
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
      // Prefer classList to manage classes instead of manipulating className strings
      input.classList.add('sudoku-cell');
      input.dataset.row = i;
      input.dataset.col = j;
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
        // Validate the cell as soon as the user types so visual feedback is
        // immediate without waiting for the check action.
        updateInputValidation(e.target);
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function renderPuzzle(puz, solvedBoard = null) {
  puzzle = puz;
  // Store the solved board so each typed value can be compared against the
  // correct answer for that specific cell.
  solution = Array.isArray(solvedBoard) ? solvedBoard : [];
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
        // mark this cell as a prefilled (locked) clue
        inp.classList.add('prefilled');
      } else {
        inp.value = '';
        inp.disabled = false;
        inp.classList.remove('prefilled');
      }
    }
  }
}

async function newGame() {
  currentDifficulty = document.getElementById('difficulty-select').value;
  hintsUsed = 0;
  const res = await fetch(`/new?difficulty=${currentDifficulty}`);
  const data = await res.json();
  // Reuse the newly returned solution from the server for live validation.
  renderPuzzle(data.puzzle, data.solution);
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
  // Keep the 'sudoku-cell' base class and mark this cell as a prefilled hint.
  input.classList.remove('incorrect');
  input.classList.add('prefilled', 'hint-cell');
  return true;
}

function applyValidationHighlights() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');

  // Walk the entire 9x9 board so the check action validates every row and
  // column, not just the visible input list order.
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const idx = row * SIZE + col;
      const input = inputs[idx];

      if (!input) {
        continue;
      }

      // Ignore locked puzzle values while still evaluating editable cells.
      if (input.disabled) {
        input.classList.remove('incorrect');
        continue;
      }

      const value = input.value;
      const isCorrect = isCellValueCorrect(row, col, value);

      // Empty editable cells and incorrect values should share the same styling,
      // while correct values should have the highlight removed. Use classList
      // methods to avoid string concatenation errors.
      if (!isCorrect || value === '') {
        input.classList.add('incorrect');
      } else {
        input.classList.remove('incorrect');
      }
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
  // Apply the shared validation logic across every editable cell so the check
  // action highlights empty and incorrect entries while clearing correct ones.
  applyValidationHighlights();

  const incorrect = new Set();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');

  // Build the incorrect-cell set by walking every row/column combination so no
  // editable cell is skipped during the final board check.
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const idx = row * SIZE + col;
      const input = inputs[idx];

      if (!input || input.disabled) {
        continue;
      }

      if (!isCellValueCorrect(row, col, input.value)) {
        incorrect.add(idx);
      }
    }
  }

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
  hintsUsed += 1;
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