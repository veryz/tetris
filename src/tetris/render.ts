import { Color, Piece, Tetris } from './tetris';

const MEMORY_CELL_SIZE = 30;

interface Element {
  color: string;
  data: number[];
  lines: number;
}

function color2rgb(color: Color) {
  if (color == 'blank') return 'lightgray';
  return color;
}

function piece2element(piece: Piece): Element {
  switch (piece) {
    case 'L':
      return { color: 'orange', data: [1, 0, 0, 0, 1, 1, 1, 0], lines: 2 };
    case 'J':
      return { color: 'blue', data: [0, 0, 1, 0, 1, 1, 1], lines: 2 };
    case 'I':
      return { color: 'cyan', data: [1, 1, 1, 1], lines: 1 };
    case 'O':
      return { color: 'yellow', data: [1, 1, 0, 0, 1, 1, 0, 0], lines: 2 };
    case 'S':
      return { color: 'green', data: [0, 1, 1, 0, 1, 1, 0, 0], lines: 2 };
    case 'Z':
      return { color: 'red', data: [1, 1, 0, 0, 0, 1, 1, 0], lines: 2 };
    case 'T':
      return { color: 'purple', data: [0, 1, 0, 0, 1, 1, 1, 0], lines: 2 };
  }
}

function clearCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext?.('2d');
  if (ctx == null) {
    throw new Error('cannot draw');
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function renderElement(
  element: Element,
  canvas: HTMLCanvasElement,
  startLine: number,
): number {
  const ctx = canvas.getContext?.('2d');
  if (ctx == null) {
    throw new Error('cannot draw');
  }

  const xfactor = MEMORY_CELL_SIZE;
  const yfactor = MEMORY_CELL_SIZE;

  ctx.fillStyle = element.color;
  for (let l = 0; l < element.lines; l++) {
    for (let i = 0; i < 4; i++) {
      if (element.data[4 * l + i])
        ctx.fillRect(i * xfactor, (startLine + l) * yfactor, xfactor, yfactor);
    }
  }

  return startLine + element.lines;
}

function renderSeparator(canvas: HTMLCanvasElement, startLine: number): number {
  const separator = { color: 'lightgray', data: [0, 0, 0, 0], lines: 1 };
  return renderElement(separator, canvas, startLine);
}

function renderSequence(
  sequence: string,
  canvas: HTMLCanvasElement,
  startLine: number = 0,
) {
  for (const char of sequence) {
    if (char === '-') {
      startLine = renderSeparator(canvas, startLine);
    } else {
      const piece = char as Piece;
      const element = piece2element(piece);
      startLine = renderElement(element, canvas, startLine);
    }
  }
}

function renderGame(tetris: Tetris, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext?.('2d');
  if (ctx == null) {
    throw new Error('cannot draw');
  }

  const xfactor = canvas.width / tetris.grid.w;
  const yfactor = canvas.height / tetris.grid.h;

  for (let x = 0; x < tetris.grid.w; x++) {
    for (let y = 0; y < tetris.grid.h; y++) {
      const color = tetris.grid.get(x, y);
      ctx.fillStyle = color2rgb(color);
      ctx.fillRect(x * xfactor, y * yfactor, xfactor, yfactor);
    }
  }

  ctx.fillStyle = 'brown'
  ctx.fillRect(tetris.cursor.x * xfactor, tetris.cursor.y * yfactor, xfactor, yfactor);
}

function renderBatch(tetris: Tetris, canvas: HTMLCanvasElement) {
  const sequence = tetris.batch.join('-');
  clearCanvas(canvas);
  renderSequence(sequence, canvas);
}

export function render(
  tetris: Tetris,
  game: HTMLCanvasElement,
  batch: HTMLCanvasElement,
) {
  renderGame(tetris, game);
  renderBatch(tetris, batch);
}
