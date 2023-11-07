import chess.pgn
import re
import json
import random
import string

# TODO
# EMPHASIZE THAT THESE WERE REAL BLUNDERS MADE BY REAL PEOPLE
# WHEN SOLVING THE PUZZLE GIVE NAME, ELO AND DATE INFO OF OG PPL WHO PLAYED THE GAME

#TODO???? this would probably take too much time and wouldn't help much. 
#implement listing puzzles as lists, and include the eval (to display to users) and the "solution" that was played (to save on CPU power)

#TODO
#make the user play as both the matee and mater

#TODO
#add blundering m2, m3 etc

#TODO
#fix bug, you can't blunder m1 in this position (only 2 legal moves) https://lichess.org/1xh1skh2#41 ID 1UA9SILZ


control = 0



def analyzePosition(board, engine):
    # Make a copy of the board and apply the given move

    # Evaluate the board position using the chess engine
    result = engine.analyse(board, chess.engine.Limit(time=0.1))
    return result

def convertedScore(scoreText):
    return int(re.search(r'-?\d+', scoreText).group())

def isBlunder(scoreText):
        if "Mate" in scoreText:
            if convertedScore(scoreText) > 0:
                #changed it to False, just testing for now
                #currently ignores all blunders where the blunderer had a MATING position
                return False
        elif convertedScore(scoreText) > -100:
            return True
        else:
            return False

def check_m1(board, engine):
    result = engine.analyse(board, chess.engine.Limit(time=0.05, depth=1, mate=1))
    return result



def analIndex(gameEndedBeforeMate):
    if gameEndedBeforeMate == True:
        return -1
    else:
        return -2
    
def getTotalGameNumber(database_path):
    f = open(database_path)
    data = f.read()

    return(data.count('Event "Rated'))

    #could theoretically be buggy if someone had his name as that but fuck it we ball

def getProgress(control, total):
    return(round(((control/total)*100), 2))

def gameCode(game):
    return str(game.headers["Site"])

#returns false if should skip
def checkElo(game, minElo):
            try:
                if int(game.headers["WhiteElo"]) < minElo or int(game.headers["BlackElo"]) < minElo:
                 print("Game skipped due to low ELO. White: ", game.headers["WhiteElo"], ", Black: ", game.headers["BlackElo"], "\n")
                 return(False)
                else:
                    return(True)
                    
            except ValueError:
                print("Game skipped due to unknown ELO.")
                return(False)



def eval(scoreText):
    if "Mate" in scoreText:
        return "M" + str(convertedScore(scoreText))
    else:
        return convertedScore(scoreText) / 100

def calcAverageElo(game):
    try:
        return round((int(game.headers["WhiteElo"]) + int(game.headers["WhiteElo"])) / 2)
    except(TypeError, ValueError):
        return "?"


def generateRandomId(output_file, length):
    try:
        characters = string.ascii_uppercase + string.digits
        puzzleID = ''.join(random.choice(characters) for i in range(length))

        #if id taken, try again
        with open(output_file, "r") as file:
            data = json.load(file)
            for item in data:
                if item["id"] == puzzleID:
                    return generateRandomId(output_file, length)
            
            return puzzleID

    except ValueError:
        ("JSON decode failed. The file is probably empty!")
        return puzzleID
    except FileNotFoundError:
        with open(output_file, "w") as file:
            print("Created file: ", output_file)


def dumpPuzzles():
    global savedPuzzles
    try:
        with open(output_file, "a+") as file:
            try:
                data = json.load(file)
                if not isinstance(data, list):
                    print("Error: Data in the file is not in the expected format (list).")
                    return
            except json.JSONDecodeError:
                data = []  # If the file is empty or has invalid JSON, start with an empty list
            
            data.append(savedPuzzles)
            json.dump(data, file, indent=4)
    except FileNotFoundError:
    # If the file doesn't exist, create a new JSON file
        with open(output_file, "w") as file:
            json.dump(savedPuzzles, file, indent=4)

    quit(0)

        
def savePuzzle(board, scoreText, game, output_file):
    global savedPuzzles
    puzzleID = generateRandomId(output_file, 8)
    output = {
            "id": puzzleID,
            "fen": board.fen(),
            "eval": eval(scoreText),
            "averageLichessElo": calcAverageElo(game), 
            "link": game.headers["Site"]
        }
    
    try:
        with open(output_file, "r") as file:
            data = json.load(file)
            #check if this FEN position is duplicated
            for item in data:
                if data["fen"] == board.fen():
                    print("Duplicate FEN position!")
                    return
        print("Found one!. FEN: ", board.fen(), ". Puzzle id: ", puzzleID, "\n")
        savedPuzzles.append(output)

    except ValueError:
        print(("JSON decode failed. The file is probably empty!"))
        with open(output_file, "r") as file:
            print("Found one!. FEN: ", board.fen(), ". Puzzle id: ", puzzleID, "\n")
            savedPuzzles.append(output)

        



def find_blunders_in_games(database_path, stockfish_path, output_file):
    # Open the chess engine
    engine = chess.engine.SimpleEngine.popen_uci(stockfish_path)

    # Open the PGN database
    with open(database_path) as database_file:
        while True:

            try:
                # Read the next game from the database
                game = chess.pgn.read_game(database_file)

                global control
                global puzzleID
                
                control += 1
                gameEndedBeforeMate = False



                #print game info
                if game is None:
                    if control == 1:
                        print("No games found in database!")
                    else:
                        dumpPuzzles()

                print("Reading game number ", control, "out of ", total, ". Progress: ", getProgress(control, total), "%")
                print("Game code:", gameCode(game))

                #skip any game where either player is below minElo elo
                if checkElo(game, minElo = 1500) == False:
                    continue


                #skip all games below 10 moves
                if game.end().ply() < 20:
                    continue



                #if game doesn't end in mate, check if opponent has M1, if not, skip
                if game.end().board().is_checkmate() == False:
                    print("Game doesn't contain checkmate! Checking if last position is M1...")
                    if check_m1(game.end().board(), engine)['score'].is_mate() == False:
                        print("Position doesn't contain M1")
                        continue
                    else:
                        gameEndedBeforeMate = True
                


                print("Proceeding as normal!")

                board = game.board()

                #mainline object is not subscriptable, have to do this or it breaks
                moves_list = list(game.mainline_moves())[:analIndex(gameEndedBeforeMate)]

                #play moves until you reach analIndex
                for move in moves_list:
                    board.push(move)


                #fuck it, we convert the PovScore to a string, then int
                #absolutely trash code but whatever :)
                #
                #this checks if they had an advantageous or equal position prior to blundering mate

                scoreText = str(analyzePosition(board, engine)["score"])
                if isBlunder(scoreText) == True:
                    #if it's check and you don't do this Stockfish crashes because you give him a position that allows the king to be captured
                    if board.is_check() == True:
                        savePuzzle(board, scoreText, game, output_file)
                        continue
                    else:
                        #push a null move to see if the guy missed the mate threat. if he just missed it we skip
                        board_copy = board.copy()
                        board_copy.push(chess.Move.null())
                        if gameEndedBeforeMate == False:
                            if check_m1(board_copy, engine)['score'].is_mate() == False:
                                print("Attempting to save!")
                                savePuzzle(board, scoreText, game, output_file)


                #this shit doesn't work
            except chess.engine.EngineTerminatedError as error: 
                print("Engine process died unexpectedly. \n", error)
                print("Game code:", gameCode)
                engine.quit()
                engine = chess.engine.SimpleEngine.popen_uci(stockfish_path)
                continue
                

                

                
                
            


    engine.quit()



if __name__ == "__main__":
    puzzleID = 0
    savedPuzzles = []
    database_path = "database/medium.pgn"
    stockfish_path = "stockfish/stockfish-windows-x86-64-avx2.exe"
    output_file = "puzzles/puzzles.json"


    total = getTotalGameNumber(database_path)

    getTotalGameNumber(database_path)
    find_blunders_in_games(database_path, stockfish_path, output_file)