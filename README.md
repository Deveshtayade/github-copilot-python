# Refactor a Sudoku Game written in Python Flask

This project is a Flask-based Sudoku game that was refactored to be more maintainable and feature-rich. It includes a generated puzzle engine, a polished web UI, and a local leaderboard.

## Getting Started

### Prerequisites

- Python 3.10+
- A modern web browser such as Chrome, Edge, or Firefox

### Install dependencies

1. Open a terminal in the project root.
2. Create and activate a virtual environment.

```bash
python -m venv .venv
```

PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks the script, run this once for the current terminal session:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Bash / Git Bash / WSL:

```bash
source .venv/bin/activate
```

3. Install the Python dependencies.

```bash
pip install -r requirements.txt
```

If you want to run the test suite as well, install pytest:

```bash
pip install pytest
```

### Run the Flask application

From the project root, start the app with:

```bash
cd starter
python app.py
```

Then open http://127.0.0.1:5000 in your browser.

### Run the tests

Run the test suite from the project root with:

```bash
pytest -q
```

You can also run it with:

```bash
python -m pytest -q
```

## Features

The Sudoku game includes the following features:

- A generated puzzle engine that creates valid boards with exactly one solution
- Difficulty selection for easy, medium, and hard games
- A timer that tracks how long each game takes
- A hint system that reveals a correct value for an empty cell
- A check button that validates the current board state
- Immediate feedback for incorrect entries and incomplete progress
- A Top 10 leaderboard stored in the browser using local storage
- A dark mode toggle for a better viewing experience
- Responsive styling that works well on desktop and mobile screens
- A congratulatory completion flow that shows the elapsed time and prompts for a leaderboard name when appropriate
