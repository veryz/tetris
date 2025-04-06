import { KeyboardEvent, useState } from 'react';
import './App.css';
import { randomTetris, Tetris } from './tetris/tetris';
import { render } from './tetris/render';

function App() {
  const [tetris, setTetris] = useState<Tetris | undefined>();
  const [textTetris, setTextTetris] = useState<string | undefined>(undefined);
  const [pressedKey, setPressedKey] = useState<string | undefined>(undefined);

  function generateTetris() {
    const tetris = randomTetris();

    setTetris(tetris);
    setTextTetris(JSON.stringify(tetris, null, 2));
    const gameCanvas = document.getElementById('tetris') as HTMLCanvasElement;
    const batchCanvas = document.getElementById('batch') as HTMLCanvasElement;
    render(tetris, gameCanvas, batchCanvas);
  }

  function handleInput(event: KeyboardEvent<HTMLCanvasElement>) {
    setPressedKey(event.code);
  }

  return (
    <>
      <div id="game">
        <canvas
          id="tetris"
          width="300"
          height="600"
          tabIndex={0}
          onKeyDown={handleInput}
        ></canvas>

        <canvas id="batch" width="90" height="570"></canvas>

        <div id="panel">
          <ul id="debug">
            <li>
              Grid dim: {tetris?.grid.w} x {tetris?.grid.h}
            </li>
            <li>
              Current: <code>{tetris?.currentPiece}</code>
            </li>
            <li>
              Memory: <code>{tetris?.memory ?? 'none'}</code>
            </li>
            <li>
              Next pieces: <code>{tetris?.batch.join(' - ')}</code>
            </li>
            <li>Speed: {tetris?.speed}</li>
            <li>
              Key: <code>{pressedKey}</code>
            </li>
          </ul>

          <button onClick={generateTetris}>create a tetris!</button>
        </div>
      </div>

      {/* <pre>{textTetris}</pre> */}
    </>
  );
}

export default App;
