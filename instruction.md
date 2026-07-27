# Project Instructions

## Project Overview

This repository contains a Flask-based Sudoku web application built as a learning project for GitHub Copilot. The app allows players to solve generated Sudoku puzzles, choose a difficulty level, request hints, validate progress, and track completion times in a local leaderboard.

## Features Implemented

- Flask web app with routes for creating a new game, validating progress, and providing hints
- Sudoku puzzle generation with a guaranteed unique solution
- Difficulty selection for easy, medium, and hard puzzles
- A live timer for each game session
- A check button to compare the current board against the solved board
- Highlighting and feedback for incorrect or invalid entries
- Hint support that reveals a correct value for an empty cell
- A Top 10 leaderboard stored in the browser with local storage
- Dark mode support and improved responsive styling
- A completion popup that displays the elapsed time and optionally saves a score

## GitHub Copilot Prompts Used

Examples of prompts that were useful during development:

- "Refactor the Flask Sudoku app to improve readability and structure"
- "Improve the Sudoku generator so each puzzle has exactly one unique solution"
- "Add a timer, difficulty selector, and hint system to the game"
- "Add a completion popup with leaderboard support"
- "Create pytest tests for Sudoku generation and validation"
- "Update the README to explain setup, running, and testing"

## Testing Instructions

Run the full test suite from the project root:

```bash
pytest -q
```

Or:

```bash
python -m pytest -q
```

The project includes backend regression tests and pytest-based Sudoku logic tests.

## Assumptions Made

- The app is intended to run locally and uses browser local storage for the leaderboard and theme preference.
- Puzzle generation is deterministic enough for testing while still using randomness for variation.
- The current implementation prioritizes clarity and maintainability over advanced production-scale features.
- The project is meant to be used as a learning and demonstration project rather than a production-ready deployment.
