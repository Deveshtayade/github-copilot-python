import copy
import random

SIZE = 9
EMPTY = 0
BOX_SIZE = 3


def deep_copy(board):
    """Return a deep copy of a Sudoku board."""
    return copy.deepcopy(board)


def create_empty_board():
    """Create an empty 9x9 Sudoku board."""
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]


def is_safe(board, row, col, num):
    """Return True when placing num at row/col does not violate Sudoku rules."""
    for x in range(SIZE):
        if board[row][x] == num or board[x][col] == num:
            return False

    start_row = (row // BOX_SIZE) * BOX_SIZE
    start_col = (col // BOX_SIZE) * BOX_SIZE
    for i in range(BOX_SIZE):
        for j in range(BOX_SIZE):
            if board[start_row + i][start_col + j] == num:
                return False
    return True


def find_empty_cell(board):
    """Return the next empty cell as (row, col), or None when the board is full."""
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                return row, col
    return None


def get_candidates(board, row, col):
    """Return the valid candidates for a cell in shuffled order."""
    candidates = [num for num in range(1, SIZE + 1) if is_safe(board, row, col, num)]
    random.shuffle(candidates)
    return candidates


def fill_board(board):
    """Recursively fill an empty board with a complete valid Sudoku solution."""
    next_cell = find_empty_cell(board)
    if next_cell is None:
        return True

    row, col = next_cell
    for candidate in get_candidates(board, row, col):
        board[row][col] = candidate
        if fill_board(board):
            return True
        board[row][col] = EMPTY
    return False


def count_solutions(board, limit=2):
    """Count the number of solutions for a puzzle, capped by the supplied limit."""
    board = deep_copy(board)
    solutions = 0

    def search():
        nonlocal solutions
        if solutions >= limit:
            return

        next_cell = find_empty_cell(board)
        if next_cell is None:
            solutions += 1
            return

        row, col = next_cell
        for candidate in get_candidates(board, row, col):
            board[row][col] = candidate
            search()
            board[row][col] = EMPTY
            if solutions >= limit:
                return

    search()
    return solutions


def generate_completed_board():
    """Create a full solved Sudoku board."""
    board = create_empty_board()
    if not fill_board(board):
        raise RuntimeError("Unable to generate a valid Sudoku board")
    return board


def get_target_clues(difficulty):
    """Map a difficulty label to the target number of clues."""
    difficulty_map = {
        'easy': 40,
        'medium': 32,
        'hard': 25,
    }
    normalized = (difficulty or '').lower()
    if normalized not in difficulty_map:
        raise ValueError('Invalid difficulty')
    return difficulty_map[normalized]


def generate_puzzle(clues=35, difficulty=None):
    """Generate a puzzle that still has exactly one unique solution."""
    if difficulty is not None:
        target_clues = get_target_clues(difficulty)
    else:
        try:
            clues = int(clues)
        except (TypeError, ValueError) as exc:
            raise ValueError("clues must be an integer") from exc
        target_clues = max(17, min(clues, SIZE * SIZE))

    while True:
        solution = generate_completed_board()
        puzzle = deep_copy(solution)

        # Remove cells in random order while keeping the puzzle uniquely solvable.
        # If a removal creates multiple solutions, restore it and continue.
        remaining_clues = SIZE * SIZE
        cells = list(range(SIZE * SIZE))
        random.shuffle(cells)

        for index in cells:
            if remaining_clues <= target_clues:
                break

            row, col = divmod(index, SIZE)
            original_value = puzzle[row][col]
            puzzle[row][col] = EMPTY

            if count_solutions(puzzle, limit=2) != 1:
                puzzle[row][col] = original_value
            else:
                remaining_clues -= 1

        if count_solutions(puzzle, limit=2) == 1:
            return puzzle, solution
