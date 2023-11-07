def savePos(board, scoreText, game, output_file):
    puzzleID = generateRandomId(output_file, 8)
    output = {
            "id": puzzleID,
            "fen": board.fen(),
            "eval": eval(scoreText),
            "averageLichessElo": calcAverageElo(game), 
            "link": game.headers["Site"]
        }

    with open(output_file, "r+") as file:
        data = json.load(file)
        #check if this FEN position is duplicated
        for entry in data:
            if entry["fen"] == board.fen():
                print("Duplicate FEN position!")
                return
        
        print("Found one!. FEN: ", board.fen(), ". Puzzle id: ", puzzleID, "\n")
        json.dump(output, file)