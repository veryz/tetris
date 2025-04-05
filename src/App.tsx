import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { randomTetris, Tetris } from './tetris/tetris';
import { render } from './tetris/render';

function App() {
  const [count, setCount] = useState(0);
  const [tetris, setTetris] = useState<Tetris | undefined>();
  const [textTetris, setTextTetris] = useState<string | undefined>(undefined);

  function generateTetris() {
    const tetris = randomTetris();

    setTetris(() => tetris);
    setTextTetris(JSON.stringify(tetris, null, 2));
    const canvas = document.getElementById('tetris') as HTMLCanvasElement;
    render(tetris, canvas);
  }

  return (
    <>
      <canvas id="tetris" width="300" height="600"></canvas>

      <button onClick={generateTetris}>create a tetris!</button>

      <pre>{textTetris}</pre>

      {/* <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p> */}
    </>
  );
}

export default App;
