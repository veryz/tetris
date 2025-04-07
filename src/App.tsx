import { KeyboardEvent, useState } from 'react';
import './App.css';
import { randomTetris, Tetris } from './tetris/tetris';
import { render } from './tetris/render';

function App() {
  const [tetris, setTetris] = useState<Tetris | undefined>();
  const [textTetris, setTextTetris] = useState<string | undefined>(undefined);
  const [pressedKey, setPressedKey] = useState<string | undefined>(undefined);
  const [ticker, setTicker] = useState<number | undefined>();

  function update(tetris: Tetris) {
    if (!tetris) return;

    const gameCanvas = document.getElementById('tetris') as HTMLCanvasElement;
    const batchCanvas = document.getElementById('batch') as HTMLCanvasElement;
    render(tetris, gameCanvas, batchCanvas);
  }

  function tick(tetris: Tetris) {
    tetris.tick();
    update(tetris);
  }

  function generateTetris() {
    const tetris = randomTetris();

    setTetris(tetris);
    setTextTetris(JSON.stringify(tetris, null, 2));

    update(tetris);

    clearInterval(ticker);
    const nextTicker = setInterval(() => tick(tetris), 1000);
    setTicker(nextTicker);
  }

  function handleInput(event: KeyboardEvent<HTMLCanvasElement>) {
    if (!tetris) return;
    setPressedKey(event.code);

    switch (event.code) {
      case 'ArrowUp':
        if (event.shiftKey) tetris.shiftUp();
        else tetris.up();
        break;

      case 'ArrowDown':
        tetris.down();
        break;

      case 'ArrowLeft':
        tetris.left();
        break;

      case 'ArrowRight':
        tetris.right();
        break;

      case 'Space':
        tetris.space();
        break;

      case 'KeyC':
        tetris.swap();
        break;

      case 'Tab':
        tetris.cycle();
        break;

      default:
        return;
    }

    event.preventDefault();

    update(tetris);
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
