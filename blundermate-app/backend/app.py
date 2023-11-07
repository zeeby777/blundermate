import random
import json
from flask import Flask, request
from flask_cors import CORS
import chess
import chess.engine


app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])
engine = chess.engine.SimpleEngine.popen_uci("stockfish/stockfish-windows-x86-64-avx2.exe")


@app.route('/getRandomPuzzle')
def getRandomPuzzle():
    with open('puzzles.json', 'r') as file:
        data = json.load(file)
        randomList = random.choice(data)
        puzzle = random.choice(randomList)
        return puzzle
    
@app.route('/checkMove')
def checkMove():
    fen = request.args.get('fen')
    UCImove = request.args.get('UCImove')
    try:
        board = chess.Board(fen)
        engineResult = engine.play(board, chess.engine.Limit(time=0.1))
        board.push(engineResult.move)
        #this assumes all puzzles can be solved by blundering M1
        #if u want to add M2, M3 etc you have to change this
        if board.is_checkmate():
            result = {
                "success": 1,
                "move": engineResult.move.uci(),
                "isSolution": 1
            }
            return result
        else:
            result = {
                "success": 1,
                "move": engineResult.move.uci(),
                "isSolution": 0
            }
            return result
    except Exception as e:
        result = {
            "success": 0,
            "message": str(e),
            "UCImove": UCImove, 
            "startingFen": fen,
        }
        return result

if __name__ == '__main__':
    app.run(debug=True)
