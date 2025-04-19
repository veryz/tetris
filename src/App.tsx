import { KeyboardEvent, useRef, useState } from 'react';
import './App.css';
import { randomTetris, Tetris } from './tetris/tetris';
import { render } from './tetris/render';

function App() {
  const [tetris, setTetris] = useState<Tetris | undefined>();
  const [pressedKey, setPressedKey] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<'init' | 'playing' | 'finished'>('init');

  const gameCanvas = useRef<HTMLCanvasElement>(null);
  const batchCanvas = useRef<HTMLCanvasElement>(null);
  const memoryCanvas = useRef<HTMLCanvasElement>(null);

  function update(tetris: Tetris) {
    if (!tetris) return;

    if (!(gameCanvas.current && batchCanvas.current && memoryCanvas.current))
      return;

    render(
      tetris,
      gameCanvas.current,
      batchCanvas.current,
      memoryCanvas.current,
    );

    setStatus(() => (tetris.finished ? 'finished' : 'playing'));
  }

  function generateTetris() {
    const tetris = randomTetris();

    setTetris(old => {
      old?.stop();
      return tetris;
    });

    tetris.onUpdate(update);

    tetris.start();
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

      case 'KeyR':
        generateTetris();
        return;

      default:
        return;
    }

    event.preventDefault();
  }

  return (
    <>
      <div id="game">
        <canvas ref={memoryCanvas} id="memory" width="120" height="60"></canvas>

        <canvas
          ref={gameCanvas}
          id="tetris"
          width="300"
          height="600"
          tabIndex={0}
          onKeyDown={handleInput}
        ></canvas>

        <canvas ref={batchCanvas} id="batch" width="120" height="570"></canvas>

        <div id="panel">
          <ul id="debug">
            <li>
              Status: <code>{status}</code>
            </li>
            <li>
              Grid dim: {tetris?.grid.w} x {tetris?.grid.h}
            </li>
            <li>
              Current: <code>{tetris?.currentGroup.name}</code>
            </li>
            <li>
              Memory: <code>{tetris?.memory ?? 'none'}</code>
            </li>
            <li>
              Next pieces: <code>{tetris?.nextPieces(5).join(' - ')}</code>
            </li>
            <li>Speed: {tetris?.speed}</li>
            <li>
              Key: <code>{pressedKey}</code>
            </li>
          </ul>

          <button onClick={generateTetris}>create a tetris!</button>
          <button onClick={() => tetris?.start()}>start</button>
          <button onClick={() => tetris?.stop()}>stop</button>
        </div>
      </div>
    </>
  );
}

export default App;
