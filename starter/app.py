from flask import Flask, render_template, jsonify, request
import sudoku_logic

app = Flask(__name__)

# Keep a simple in-memory store for the current puzzle and solution.
CURRENT = {
    'puzzle': None,
    'solution': None,
}


def _parse_board(payload):
    """Validate and return a 9x9 board from a JSON payload."""
    if not isinstance(payload, dict):
        raise ValueError('Request body must be a JSON object')

    board = payload.get('board')
    if not isinstance(board, list) or len(board) != sudoku_logic.SIZE:
        raise ValueError('Board must be a 9x9 grid')

    for row in board:
        if not isinstance(row, list) or len(row) != sudoku_logic.SIZE:
            raise ValueError('Board must be a 9x9 grid')

    return board


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/new')
def new_game():
    difficulty = request.args.get('difficulty', 'easy')
    clues = request.args.get('clues')

    if clues is None:
        clues = None
    else:
        try:
            clues = int(clues)
        except (TypeError, ValueError):
            return jsonify({'error': 'Invalid clues parameter'}), 400

    try:
        puzzle, solution = sudoku_logic.generate_puzzle(clues, difficulty=difficulty)
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    CURRENT['puzzle'] = puzzle
    CURRENT['solution'] = solution
    # Return the solution alongside the puzzle so the client can validate
    # each typed entry immediately without waiting for the check button.
    return jsonify({'puzzle': puzzle, 'solution': solution})


@app.route('/check', methods=['POST'])
def check_solution():
    try:
        board = _parse_board(request.get_json(silent=True))
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    solution = CURRENT.get('solution')
    if solution is None:
        return jsonify({'error': 'No game in progress'}), 400

    incorrect = []
    for row in range(sudoku_logic.SIZE):
        for col in range(sudoku_logic.SIZE):
            if board[row][col] != solution[row][col]:
                incorrect.append([row, col])
    return jsonify({'incorrect': incorrect})


@app.route('/hint', methods=['POST'])
def provide_hint():
    try:
        board = _parse_board(request.get_json(silent=True))
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    solution = CURRENT.get('solution')
    if solution is None:
        return jsonify({'error': 'No game in progress'}), 400

    for row in range(sudoku_logic.SIZE):
        for col in range(sudoku_logic.SIZE):
            if board[row][col] == 0:
                return jsonify({
                    'hint': {
                        'row': row,
                        'col': col,
                        'value': solution[row][col],
                    }
                })

    return jsonify({'error': 'No empty cells available for a hint'}), 400


if __name__ == '__main__':
    app.run(debug=True)