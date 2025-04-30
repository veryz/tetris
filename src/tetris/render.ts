import { Color, Piece, Tetris } from './tetris';

const MEMORY_CELL_SIZE = 30;

interface Element {
  color: string;
  data: number[];
  lines: number;
}

function color2rgb(color: Color) {
  return {
    blank: 'lightgray',
    blue: 'rgb( 0, 0, 255)',
    cyan: 'rgb( 0, 255, 255)',
    green: 'rgb( 0, 192, 0)',
    orange: 'rgb(255, 127, 0)',
    purple: 'rgb(255, 0, 255)',
    red: 'rgb(255, 0, 0)',
    yellow: 'rgb(255, 255, 0)',
  }[color];
}

function color2light(color: Color) {
  return {
    blank: 'lightgray',
    blue: 'rgba(6, 6, 255, 0.5)',
    cyan: 'rgba(0, 255, 255, 0.5)',
    green: 'rgba(0, 192, 0, 0.5)',
    orange: 'rgba(255, 127, 0, 0.5)',
    purple: 'rgba(255, 0, 255, 0.5)',
    red: 'rgba(255, 0, 0, 0.5)',
    yellow: 'rgba(255, 255, 0, 0.5)',
  }[color];
}

function piece2element(piece: Piece): Element {
  switch (piece) {
    case 'L':
      return {
        color: color2rgb('orange'),
        data: [0, 0, 1, 0, 1, 1, 1],
        lines: 2,
      };
    case 'J':
      return {
        color: color2rgb('blue'),
        data: [1, 0, 0, 0, 1, 1, 1, 0],
        lines: 2,
      };
    case 'I':
      return { color: color2rgb('cyan'), data: [1, 1, 1, 1], lines: 1 };
    case 'O':
      return {
        color: color2rgb('yellow'),
        data: [1, 1, 0, 0, 1, 1, 0, 0],
        lines: 2,
      };
    case 'S':
      return {
        color: color2rgb('green'),
        data: [0, 1, 1, 0, 1, 1, 0, 0],
        lines: 2,
      };
    case 'Z':
      return {
        color: color2rgb('red'),
        data: [1, 1, 0, 0, 0, 1, 1, 0],
        lines: 2,
      };
    case 'T':
      return {
        color: color2rgb('purple'),
        data: [0, 1, 0, 0, 1, 1, 1, 0],
        lines: 2,
      };
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

function renderGroupProjection(tetris: Tetris, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext?.('2d');
  if (!ctx) throw new Error('cannot draw');

  const xfactor = canvas.width / tetris.grid.w;
  const yfactor = canvas.height / tetris.grid.h;

  tetris.currentGroup.projected.forEach(pt => {
    const color = tetris.grid.get(pt.x, pt.y);
    if (color !== 'blank') return;
    ctx.fillStyle = color2light(tetris.currentGroup.color);
    ctx.fillRect(pt.x * xfactor, pt.y * yfactor, xfactor, yfactor);
  });
}

function renderGridAlignment(tetris: Tetris, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext?.('2d');
  if (ctx == null) {
    throw new Error('cannot draw');
  }

  const xfactor = canvas.width / tetris.grid.w;
  const yfactor = canvas.height / tetris.grid.h;

  for (let x = 1; x < tetris.grid.w; x++) {
    for (let y = 1; y < tetris.grid.h; y++) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(x * xfactor - 1, y * yfactor - 1, 2, 2);
    }
  }
}

function renderGame(tetris: Tetris, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext?.('2d');
  if (ctx == null) {
    throw new Error('cannot draw');
  }

  // Background
  ctx.fillStyle = color2rgb('blank');
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid helper
  renderGridAlignment(tetris, canvas);

  // All blocks
  const xfactor = canvas.width / tetris.grid.w;
  const yfactor = canvas.height / tetris.grid.h;

  for (let x = 0; x < tetris.grid.w; x++) {
    for (let y = 0; y < tetris.grid.h; y++) {
      const color = tetris.grid.get(x, y);
      if (color === 'blank') continue;
      ctx.fillStyle = color2rgb(color);
      ctx.fillRect(x * xfactor, y * yfactor, xfactor, yfactor);
    }
  }

  if (!tetris.finished) {
    renderGroupProjection(tetris, canvas);
  }
}

function renderBatch(tetris: Tetris, canvas: HTMLCanvasElement) {
  const sequence = tetris.nextPieces(5).join('-');
  clearCanvas(canvas);
  renderSequence(sequence, canvas);
}

function renderMemory(tetris: Tetris, canvas: HTMLCanvasElement) {
  clearCanvas(canvas);
  if (tetris.memory == null) return;
  renderElement(piece2element(tetris.memory), canvas, 0);
}

export function render(
  tetris: Tetris,
  game: HTMLCanvasElement,
  batch: HTMLCanvasElement,
  memory: HTMLCanvasElement,
) {
  renderGame(tetris, game);
  renderBatch(tetris, batch);
  renderMemory(tetris, memory);
}
