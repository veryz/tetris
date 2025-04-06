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

export interface Point {
  x: number;
  y: number;
}

export type Position = Point;

function point(x: number, y: number): Point {
  return { x, y };
}

export interface Group {
  grid: Grid;
  points: Point[];
  position: Position;
  canRotate(): boolean;
  rotate(): void;
  canSpawn(): boolean;
  spawn(): void;
}

function pointsToSpawn(grid: Grid, points: Point[], origin: Point) {
  const squares: Point[] = [];
  const canPlace = points.every((pt) => {
    const x = origin.x + pt.x;
    const y = origin.y + pt.y;
    const color = grid.get(x, y);
    const free = color === 'blank';
    if (!free) return false;
    squares.push(point(x, y));
    return true;
  });
  if (!canPlace) throw new Error('cannot place T');

  return { canPlace, points: squares };
}

abstract class AbstractGroup implements Group {
  constructor(
    public grid: Grid,
    public points: Point[],
    public position: Position,
    public name: Piece,
    public color: Color,
  ) {}

  boundingBox() {
    let [xmin, xmax, ymin, ymax]: (number | undefined)[] = [];
    this.points.forEach((pt) => {
      xmin ??= pt.x;
      xmax ??= pt.x;
      ymin ??= pt.y;
      ymax ??= pt.y;
      xmin = pt.x < xmin ? pt.x : xmin;
      xmax = pt.x < xmax ? pt.x : xmax;
      ymin = pt.x < ymin ? pt.x : ymin;
      ymax = pt.x < ymax ? pt.x : ymax;
    });
    return { xmin, xmax, ymin, ymax };
  }

  boundingSquare() {
    const { xmin, xmax, ymin, ymax } = this.boundingBox();
    const [dx, dy] = [xmax - xmin + 1, ymax - ymin + 1];
    if (dx == dy) return { xmin, xmax, ymin, ymax };
    else if (dx < dy)
      return {
        xmin: xmin + Math.floor(dy / 2),
        xmax: xmax + Math.ceil(dy / 2),
        ymin,
        ymax,
      };
    else
      return {
        xmin,
        xmax,
        ymin: xmin + Math.floor(dx / 2),
        ymax: xmax + Math.ceil(dx / 2),
      };
  }

  canRotate(): boolean {
    throw new Error('Method not implemented.');
  }

  rotate(): void {
    throw new Error('Method not implemented.');
  }

  canSpawn(): boolean {
    return pointsToSpawn(this.grid, this.points, this.position).canPlace;
  }

  spawn(): void {
    const { canPlace, points } = pointsToSpawn(
      this.grid,
      this.points,
      this.position,
    );
    if (!canPlace) throw new Error('cannot spawn ' + this.name);
    points.forEach((pt) => this.grid.set(pt.x, pt.y, this.color));
  }
}

class GroupT extends AbstractGroup {
  constructor(grid: Grid, position: Point) {
    const points = [point(1, 0), point(0, 1), point(1, 1), point(2, 1)];
    super(grid, points, position, 'T', 'purple');
  }
}

export class Tetris {
  constructor(
    public grid: Grid,
    public currentGroup: Group,
    public currentPiece: Piece,
    public memory: Piece | null,
    public usedMemory: boolean,
    public batch: Piece[],
    public speed: number,
    public cursor: { x: number; y: number },
  ) {
    currentGroup.spawn();
  }

  // BEGIN Player actions

  left() {
    this.setCursor(this.cursor.x - 1, this.cursor.y);
  }

  right() {
    this.setCursor(this.cursor.x + 1, this.cursor.y);
  }

  up() {
    this.setCursor(this.cursor.x, this.cursor.y - 1);
  }

  down() {
    this.setCursor(this.cursor.x, this.cursor.y + 1);
  }

  space() {
    this.setCursor(this.cursor.x, this.grid.h - 1);
  }

  swap() {
    throw new Error('swap not implemented');
  }

  // END Player actions

  tick() {
    this.setCursor(this.cursor.x, Math.min(this.cursor.y + 1, this.grid.h - 1));
  }

  setCursor(x: number, y: number) {
    this.cursor = { x, y };
  }
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
  const grid = new Grid(10, 20);
  const batch = randomBatch();
  const group = new GroupT(grid, point(4, 0));
  const tetris = new Tetris(
    grid,
    group,
    'T',
    null,
    false,
    batch,
    1,
    point(5, 10),
  );
  return tetris;
}
