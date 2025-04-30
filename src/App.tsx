import { KeyboardEvent, useRef, useState } from 'react';
import './App.css';
import { newTetris, Tetris } from './tetris/tetris';
import { render } from './tetris/render';
import { Input, InputHandler } from './tetris/input';

function App() {
  const [tetris, setTetris] = useState<Tetris | undefined>();
  const [inputHandler, setInputHandler] = useState<InputHandler | undefined>();
  const [pressedKey, setPressedKey] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<
    'init' | 'playing' | 'paused' | 'finished'
  >('init');
  const [showDebug, setDebug] = useState(false);

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

    setStatus(() =>
      tetris.finished ? 'finished' : tetris.isPaused() ? 'paused' : 'playing',
    );
  }

  function generateTetris() {
    const next = newTetris();

    tetris?.stop();
    inputHandler?.detach();

    const nextInputHandler = new Input(next);
    if (gameCanvas.current == null) {
      throw new Error('no canvas available to plug input handler');
    } else {
      nextInputHandler.attach(gameCanvas.current);
    }

    setTetris(next);
    setInputHandler(nextInputHandler);

    next.onUpdate(update);

    next.start();
  }

  function play() {
    generateTetris();
    gameCanvas.current?.focus();
  }

  function handleInput(event: KeyboardEvent<HTMLCanvasElement>) {
    if (!tetris) return;
    setPressedKey(event.code);

    switch (event.code) {
      case 'KeyR':
        play();
        return;

      case 'KeyI':
        setDebug(!showDebug);
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
          <ul id="debug" hidden={!showDebug}>
            <li>
              Status: <code>{status}</code>
            </li>
            <li>
              Grid dim:{' '}
              <code>
                {tetris?.grid.w ?? '-'} × {tetris?.grid.h ?? '-'}
              </code>
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
            <li>
              Speed: <code>{tetris?.speed}</code>
            </li>
            <li>
              Key: <code>{pressedKey}</code>
            </li>
          </ul>

          <button onClick={play}>Play</button>
          <button
            onClick={() =>
              status == 'paused' ? tetris?.start() : tetris?.stop()
            }
          >
            {status == 'paused' ? 'Resume' : 'Pause'}
          </button>

          <div id="help">
            <fieldset>
              <legend>Controls</legend>
              <ul>
                <li>
                  <code>←</code> <code>→</code> <code>↓</code> : left,
                  right, down
                </li>
                <li>
                  <code>↑</code> : rotate
                </li>
                <li>
                  <code>C</code> : swap
                </li>
                <li>
                  <code>Space</code> : instant drop
                </li>
                <li>
                  <code>X</code> : instant dive
                </li>
              </ul>
            </fieldset>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
