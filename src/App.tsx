import { KeyboardEvent, useRef, useState } from 'react';
import './App.css';
import { newTetris, Tetris } from './tetris/tetris';
import { render } from './tetris/render';
import { Action, Input, InputHandler, Keybind } from './tetris/input';

function ControlsStatic() {
  return (
    <>
      <ul>
        <li>
          <code>←</code> <code>→</code> <code>↓</code> : left, right, down
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
    </>
  );
}

function ControlsDynamic({ inputHandler }: { inputHandler: InputHandler }) {
  const [keybind, setKeybind] = useState<Keybind>(inputHandler.getKeybind());

  function handleBind(action: Action) {
    return (e: KeyboardEvent) => {
      e.preventDefault();
      inputHandler?.setKeybind(action, e.code);
      setKeybind(inputHandler?.getKeybind());
    };
  }

  const controls: { action: Action; name: string }[] = [
    { action: 'left', name: 'Left' },
    { action: 'right', name: 'Right' },
    { action: 'down', name: 'Down' },
    { action: 'up', name: 'Rotate' },
    { action: 'c', name: 'Swap' },
    { action: 'space', name: 'Drop' },
    { action: 'x', name: 'Dive' },
  ];

  const list = controls.map(c => (
    <li key={c.action}>
      <input
        type="text"
        onKeyDown={handleBind(c.action)}
        value={keybind?.[c.action] ?? ''}
        readOnly
      />{' '}
      {c.name}
    </li>
  ));

  return (
    <>
      <ul>{list}</ul>
    </>
  );
}

function App() {
  const [tetris, setTetris] = useState<Tetris | undefined>();
  const [inputHandler, setInputHandler] = useState<InputHandler | undefined>();
  const [pressedKey, setPressedKey] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<
    'init' | 'playing' | 'paused' | 'finished'
  >('init');
  const [showDebug, setDebug] = useState(false);
  const [customizedKeybinding, setCustomizedKeybinding] = useState(false);

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

  function initHandler(tetris: Tetris) {
    if (inputHandler == null) {
      const nextInputHandler = new Input(tetris);
      if (gameCanvas.current == null) {
        throw new Error('no canvas available to plug input handler');
      } else {
        nextInputHandler.attach(gameCanvas.current);
      }
      setInputHandler(nextInputHandler);
      return nextInputHandler;
    } else {
      return inputHandler;
    }
  }

  function generateTetris() {
    const next = newTetris();

    tetris?.stop();
    setTetris(next);

    const handler = inputHandler ?? initHandler(next);

    handler.tetris = next;
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

  const controls =
    customizedKeybinding && inputHandler ? (
      <ControlsDynamic inputHandler={inputHandler} />
    ) : (
      <ControlsStatic />
    );

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
          {showDebug && (
            <ul id="debug">
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
          )}

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

              {controls}

              {customizedKeybinding ? (
                <button
                  onClick={() => {
                    inputHandler?.resetKeybind();
                    setCustomizedKeybinding(false);
                  }}
                >
                  Default
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (tetris) setCustomizedKeybinding(true);
                  }}
                >
                  Customize
                </button>
              )}
            </fieldset>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
