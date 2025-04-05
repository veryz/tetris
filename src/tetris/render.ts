import { Color, Tetris } from './tetris';

function color2rgb(color: Color) {
  if (color == 'blank') return 'lightgray';
  return color;
}

export function render(tetris: Tetris, canvas: HTMLCanvasElement) {
  if (!canvas.getContext) {
    throw new Error('cannot draw');
  }

  const ctx = canvas.getContext('2d');
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
}
