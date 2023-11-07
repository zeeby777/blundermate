import { useState, useEffect } from "react";
import "./index.css";
import Game from "./Game";

function App() {
  return (
    <div id="floatParent">
      <div id="game" class="floatChild">
        <Game />
      </div>
      <div id="fluff" class="floatChild">
        <section>
          <h1>Chess is hard.</h1>
          <p>
            Have you ever played a chess move that was so bad it perplexed you?
          </p>
          <p>
            Personally, I find myself in this situation about every other game.
          </p>
          <br></br>
          <p>
            I've decided to compile the best{" "}
            <b>
              <u>REAL</u>
            </b>{" "}
            blunders made by{" "}
            <b>
              <u>REAL</u>
            </b>{" "}
            players on Lichess. Your goal is to recreate them!{" "}
          </p>
          <p>
            <b>
              You need to make a move that blunders Mate in 1 for your opponent.
              Not M2, not M3, M1.
            </b>{" "}
          </p>
          <p>
            That's because it makes the puzzles harder and stuff and definitely
            not because I can't be bothered. Maybe in the future!
          </p>
          <p>
            Anyways, since this page still seems pretty empty,{" "}
            <a
              href="https://twitter.com/zeeby_x"
              target="_blank"
              rel="noopener noreferrer"
            >
              Follow my Twitter.
            </a>
          </p>
          <p>
            Also, I know this website is super awesome, and you probably want to
            donate lots of money to me, but I must disappoint you, I don't have
            a Patreon :&#40;{" "}
          </p>
        </section>
      </div>
    </div>
  );
}
export default App;
