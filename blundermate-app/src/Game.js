import { useState, useEffect } from "react";
import Chess from "chess.js";
import { Chessboard } from "react-chessboard";
import "./index.css";

function Game() {
  const BACKEND_URL = process.env.REACT_APP_API_URL
  const [currentPuzzle, setCurrentPuzzle] = useState(null);

  function sideToPlay(fen) {
    const fields = String(fen).split(" ");
    if (fields[1] == "w") {
      return "white";
    } else {
      return "black";
    }
  }

  async function fetchResponse(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching puzzle:", error);
      return null;
    }
  }

  async function fetchPuzzle() {
    const data = await fetchResponse(BACKEND_URL + "/getRandomPuzzle");
    if (data) {
      const updatedPuzzle = {
        averageLichessElo: data.averageLichessElo,
        stockfishEval: data.eval,
        fen: data.fen,
        id: data.id,
        link: data.link,
        sideToPlay: sideToPlay(data.fen),
      };
      setCurrentPuzzle(updatedPuzzle);
    }
  }
  useEffect(() => {
    fetchPuzzle();
  }, []);

  return (
    <div id="game">
      <PuzzleInfoBar currentPuzzle={currentPuzzle} />
      <MyChessboard currentPuzzle={currentPuzzle} fetchPuzzle={fetchPuzzle} />
      <GameMenu fetchPuzzle={fetchPuzzle} />
    </div>
  );
}

function PuzzleInfoBar(props) {
  function addPlus(value) {
    if (String(value)[0] == "-" || String(value) === "0.00") {
      return value;
    } else {
      return "+" + String(value);
    }
  }
  return (
    <div id="puzzleInfoBar" className="gamePanel">
      <p>Average Lichess Elo: {props.currentPuzzle?.averageLichessElo}</p>
      <p>
        Stockfish Evaluation: {addPlus(props.currentPuzzle?.stockfishEval)} for{" "}
        {props.currentPuzzle?.sideToPlay.charAt(0).toUpperCase() +
          props.currentPuzzle?.sideToPlay.slice(1)}{" "}
      </p>
      <p>Puzzle ID: {props.currentPuzzle?.id}</p>
    </div>
  );
}

function GameMenu(props) {
  return (
    <div id="GameMenu" className="gamePanel">
      <button id="skipButton" onClick={() => window.location.reload()}>
        Skip →
      </button>
    </div>
  );
}

function MyChessboard(props) {
  const [game, setGame] = useState(new Chess());
  const [moveFrom, setMoveFrom] = useState("");
  const [moveTo, setMoveTo] = useState(null);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [rightClickedSquares, setRightClickedSquares] = useState({});
  const [moveSquares, setMoveSquares] = useState({});
  const [optionSquares, setOptionSquares] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (props.currentPuzzle?.fen) {
      const game = new Chess(props.currentPuzzle.fen);
      setGame(game);
    }
  }, [props.currentPuzzle]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  function safeGameMutate(modify) {
    setGame((g) => {
      const update = { ...g };
      modify(update);
      return update;
    });
  }

  function getMoveOptions(square) {
    const moves = game.moves({
      square,
      verbose: true,
    });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares = {};
    moves.map((move) => {
      newSquares[move.to] = {
        background:
          game.get(move.to) &&
          game.get(move.to).color !== game.get(square).color
            ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
            : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
        borderRadius: "50%",
      };
      return move;
    });
    newSquares[square] = {
      background: "rgba(255, 255, 0, 0.4)",
    };
    setOptionSquares(newSquares);
    return true;
  }
  async function fetchMove(url, fen, UCImove) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching puzzle:", error);
      return null;
    }
  }

  function botMove(stockfishMoveUCI) {
    // exit if the game is over
    if (game.game_over() || game.in_draw()) return;

    const moveObj = {
      from: stockfishMoveUCI.substring(0, 2),
      to: stockfishMoveUCI.substring(2, 4),
      promotion: "q", // default to queen for now
    };

    safeGameMutate((game) => {
      game.move(moveObj);
    });
  }

  async function onSquareClick(square) {
    setRightClickedSquares({});

    // from square
    if (!moveFrom) {
      const hasMoveOptions = getMoveOptions(square);
      if (hasMoveOptions) setMoveFrom(square);
      return;
    }

    // to square
    if (!moveTo) {
      // check if valid move before showing dialog
      const moves = game.moves({
        moveFrom,
        verbose: true,
      });
      const foundMove = moves.find(
        (m) => m.from === moveFrom && m.to === square
      );
      // not a valid move
      if (!foundMove) {
        // check if clicked on new piece
        const hasMoveOptions = getMoveOptions(square);
        // if new piece, setMoveFrom, otherwise clear moveFrom
        setMoveFrom(hasMoveOptions ? square : "");
        return;
      }

      // valid move
      setMoveTo(square);

      // if promotion move
      if (
        (foundMove.color === "w" &&
          foundMove.piece === "p" &&
          square[1] === "8") ||
        (foundMove.color === "b" &&
          foundMove.piece === "p" &&
          square[1] === "1")
      ) {
        setShowPromotionDialog(true);
        return;
      }

      // is normal move
      const gameCopy = { ...game };
      const move = gameCopy.move({
        from: moveFrom,
        to: square,
        promotion: "q",
      });
      if (move) {
        const uciMove = `${move.from}${move.to}`; // Constructing the UCI format
        const result = await fetchMove(
          BACKEND_URL +
          `/checkMove?fen=${encodeURIComponent(
            game.fen()
          )}&UCImove=${uciMove}`
        );
        console.log(result);
        if (result.isSolution === 1) {
          console.log("isSolution = 1");
          // Push the bot's move to the board
          console.log(result.move);
          botMove(result.move);

          setTimeout(async () => {
            props.fetchPuzzle();
          }, 500);
        } else if (result.isSolution === 0) {
          console.log("isSolution = 0");
          // Reset the board to the original puzzle FEN
          setGame(new Chess(props.currentPuzzle?.fen));
          setMoveFrom("");
          setMoveTo(null);
          setOptionSquares({});
          setRightClickedSquares({});
          return;
        }
      }

      // if invalid, setMoveFrom and getMoveOptions
      if (move === null) {
        const hasMoveOptions = getMoveOptions(square);
        if (hasMoveOptions) setMoveFrom(square);
        return;
      }

      setGame(gameCopy);

      setMoveFrom("");
      setMoveTo(null);
      setOptionSquares({});
      return;
    }
  }

  function onPromotionPieceSelect(piece) {
    // if no piece passed then user has cancelled dialog, don't make move and reset
    if (piece) {
      const gameCopy = { ...game };
      gameCopy.move({
        from: moveFrom,
        to: moveTo,
        promotion: piece[1].toLowerCase() ?? "q",
      });
      setGame(gameCopy);
    }

    setMoveFrom("");
    setMoveTo(null);
    setShowPromotionDialog(false);
    setOptionSquares({});
    return true;
  }

  function onSquareRightClick(square) {
    const colour = "rgba(0, 0, 255, 0.4)";
    setRightClickedSquares({
      ...rightClickedSquares,
      [square]:
        rightClickedSquares[square] &&
        rightClickedSquares[square].backgroundColor === colour
          ? undefined
          : { backgroundColor: colour },
    });
  }

  return (
    <div className="boardWrapper">
      <Chessboard
        id="ClickToMove"
        animationDuration={200}
        arePiecesDraggable={false}
        position={game.fen()}
        onSquareClick={onSquareClick}
        onSquareRightClick={onSquareRightClick}
        onPromotionPieceSelect={onPromotionPieceSelect}
        boardOrientation={props.currentPuzzle?.sideToPlay}
        customBoardStyle={{
          borderRadius: "4px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
        }}
        customSquareStyles={{
          ...moveSquares,
          ...optionSquares,
          ...rightClickedSquares,
        }}
        promotionToSquare={moveTo}
        showPromotionDialog={showPromotionDialog}
      />
    </div>
  );
}

export default Game;
