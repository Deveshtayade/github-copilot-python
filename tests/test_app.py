import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "starter"))

import sudoku_logic
from app import app, CURRENT


class SudokuAppTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        CURRENT["puzzle"] = None
        CURRENT["solution"] = None

    def test_new_game_returns_puzzle(self):
        response = self.client.get("/new?difficulty=easy")
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertIn("puzzle", payload)
        self.assertEqual(len(payload["puzzle"]), 9)

    def test_difficulty_selects_expected_clue_count(self):
        for difficulty, expected in [("easy", 40), ("medium", 32), ("hard", 25)]:
            response = self.client.get(f"/new?difficulty={difficulty}")
            self.assertEqual(response.status_code, 200)
            puzzle = response.get_json()["puzzle"]
            clues = sum(1 for row in puzzle for value in row if value != 0)
            self.assertGreaterEqual(clues, expected - 1)
            self.assertLessEqual(clues, expected + 1)

    def test_check_solution_requires_active_game(self):
        response = self.client.post(
            "/check",
            json={"board": [[0] * 9 for _ in range(9)]},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("No game in progress", response.get_json()["error"])

    def test_invalid_clues_returns_400(self):
        response = self.client.get("/new?clues=abc")
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid clues", response.get_json()["error"])

    def test_invalid_board_shape_returns_400(self):
        CURRENT["solution"] = [[0] * 9 for _ in range(9)]
        response = self.client.post(
            "/check",
            json={"board": [[0] * 8 for _ in range(8)]},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Board must be a 9x9 grid", response.get_json()["error"])

    def test_generated_puzzle_has_a_unique_solution(self):
        puzzle, solution = sudoku_logic.generate_puzzle(35)
        self.assertEqual(len(puzzle), sudoku_logic.SIZE)
        self.assertEqual(len(solution), sudoku_logic.SIZE)
        self.assertEqual(sudoku_logic.count_solutions(puzzle, limit=2), 1)

    def test_hint_returns_a_single_correct_value(self):
        puzzle, solution = sudoku_logic.generate_puzzle(35)
        CURRENT["puzzle"] = puzzle
        CURRENT["solution"] = solution
        response = self.client.post(
            "/hint",
            json={"board": puzzle},
        )
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertIn("hint", payload)
        self.assertEqual(payload["hint"]["value"], solution[payload["hint"]["row"]][payload["hint"]["col"]])


if __name__ == "__main__":
    unittest.main()
