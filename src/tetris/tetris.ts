export type Color =
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'cyan'
  | 'blank';

function randomColor() {
  const all = [
    'red',
    'blue',
    'green',
    'yellow',
    'purple',
    'orange',
    'cyan',
    'blank',
  ] satisfies Color[];
  return all[Math.floor(Math.random() * all.length)];
}

function initGrid<T>(width: number, height: number, value: T) {
  const grid: T[][] = [];
  for (let x = 0; x < width; x++) {
    const column: T[] = [];
    for (let y = 0; y < height; y++) {
      column.push(value);
    }
    grid.push(column);
  }
  return grid;
}

export class Grid {
  private grid: Color[][];

  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.grid = initGrid(this.w, this.h, 'blank');
  }

  get(x: number, y: number) {
    this.validate(x, y);
    return this.grid[x][y];
  }

  set(x: number, y: number, c: Color) {
    this.validate(x, y);
    this.grid[x][y] = c;
  }

  private validate(x: number, y: number) {
    if (0 <= x && x <= this.w && 0 <= y && y <= this.h) return;
    throw new Error('out of bounds');
  }

  static random(width: number, height: number) {
    const g = new Grid(width, height);
    for (let x = 0; x < g.w; x++) {
      for (let y = 0; y < g.h; y++) {
        const color = randomColor();
        g.grid[x][y] = color;
      }
    }
    return g;
  }
}

export type Piece = 'L' | 'J' | 'I' | 'O' | 'S' | 'Z' | 'T';

export class Tetris {
  constructor(
    public grid: Grid,
    public currentPiece: Piece,
    public memory: Piece | null,
    public usedMemory: boolean,
    public batch: Piece[],
    public speed: number,
  ) {}
}

export function randomBatch(): Piece[] {
  const batch: Piece[] = [];
  const all = ['L', 'J', 'I', 'O', 'S', 'Z', 'T'] satisfies Piece[];

  while (all.length > 0) {
    const i = Math.floor(Math.random() * all.length);
    const x = all.splice(i, 1)[0];
    batch.push(x);
  }

  return batch;
}

export function randomTetris() {
  console.log('creating a random tetris!');
  const grid = Grid.random(10, 20);
  const batch = randomBatch();
  const tetris = new Tetris(grid, 'T', null, false, batch, 1);
  return tetris;
}
