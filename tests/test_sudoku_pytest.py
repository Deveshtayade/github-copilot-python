import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "starter"))

import sudoku_logic


@pytest.fixture
def sample_puzzle():
    puzzle, solution = sudoku_logic.generate_puzzle(35)
    return puzzle, solution


def test_generated_puzzle_has_exactly_one_solution(sample_puzzle):
    puzzle, solution = sample_puzzle

    assert len(puzzle) == sudoku_logic.SIZE
    assert len(solution) == sudoku_logic.SIZE
    assert sudoku_logic.count_solutions(puzzle, limit=2) == 1


def test_puzzle_is_valid_sudoku_board(sample_puzzle):
    puzzle, _ = sample_puzzle

    for row in puzzle:
        assert len(row) == sudoku_logic.SIZE

    for row in range(sudoku_logic.SIZE):
        row_values = puzzle[row]
        assert len(set(row_values)) <= sudoku_logic.SIZE
        for value in row_values:
            assert value in range(0, sudoku_logic.SIZE + 1)

    for col in range(sudoku_logic.SIZE):
        col_values = [puzzle[row][col] for row in range(sudoku_logic.SIZE)]
        assert len(set(col_values)) <= sudoku_logic.SIZE

    for box_row in range(0, sudoku_logic.SIZE, sudoku_logic.BOX_SIZE):
        for box_col in range(0, sudoku_logic.SIZE, sudoku_logic.BOX_SIZE):
            box_values = []
            for row in range(box_row, box_row + sudoku_logic.BOX_SIZE):
                for col in range(box_col, box_col + sudoku_logic.BOX_SIZE):
                    box_values.append(puzzle[row][col])
            assert len(set(box_values)) <= sudoku_logic.SIZE


def test_puzzle_contains_valid_initial_clues(sample_puzzle):
    puzzle, solution = sample_puzzle

    for row in range(sudoku_logic.SIZE):
        for col in range(sudoku_logic.SIZE):
            if puzzle[row][col] != 0:
                assert puzzle[row][col] == solution[row][col]
