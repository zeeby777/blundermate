import { useState, useEffect } from "react";
import Chess from "chess.js";
import { Chessboard } from "react-chessboard";
import "./index.css";

function Game() {
  function GetPuzzle() {
    console.log("dn");
    const [puzzleData, setPuzzleData] = useState(null);
    const [currentPuzzle, setCurrentPuzzle] = useState(null);
    async function fetchPuzzle() {
      try {
        const response = await fetch("http://localhost:5000/getRandomPuzzle");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching puzzle:", error);
        return null;
      } finally {
      }
    }
    // fetch data
    useEffect(() => {
      async function fetchData() {
        const data = await fetchPuzzle();
        setPuzzleData(data);
      }
      fetchData();
    }, []);

    //create a new json object called currentPuzzle with all the data you need
    useEffect(() => {
      if (puzzleData) {
        var updatedPuzzle = {
          averageLichessElo: puzzleData.averageLichessElo,
          stockfishEval: puzzleData.eval,
          fen: puzzleData.fen,
          id: puzzleData.id,
          link: puzzleData.link,
        };
        setCurrentPuzzle(updatedPuzzle);
      }
    }, [puzzleData]);
    return (
      <div>
        <MyChessboard currentPuzzle={currentPuzzle} />
      </div>
    );
  }

  function PuzzleInfo(props) {
    return (
      <div>
        <span></span>
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

    function sideToPlay(fen) {
      const fields = String(fen).split(" ");
      if (fields[1] == "w") {
        return "white";
      } else {
        return "black";
      }
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

    function makeRandomMove() {
      const possibleMoves = game.moves();

      // exit if the game is over
      if (game.game_over() || game.in_draw() || possibleMoves.length === 0)
        return;

      const randomIndex = Math.floor(Math.random() * possibleMoves.length);
      safeGameMutate((game) => {
        game.move(possibleMoves[randomIndex]);
      });
    }

    function onSquareClick(square) {
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

        // if invalid, setMoveFrom and getMoveOptions
        if (move === null) {
          const hasMoveOptions = getMoveOptions(square);
          if (hasMoveOptions) setMoveFrom(square);
          return;
        }

        setGame(gameCopy);

        setTimeout(makeRandomMove, 300);
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
        setTimeout(makeRandomMove, 300);
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
          boardOrientation={sideToPlay(props.currentPuzzle?.fen)}
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
  return (
    <div id="game">
      <GetPuzzle />
      <PuzzleInfo />
    </div>
  );
}
export default Game;
