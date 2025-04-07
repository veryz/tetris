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

  isValid(x: number, y: number) {
    return 0 <= x && x <= this.w && 0 <= y && y <= this.h;
  }

  private validate(x: number, y: number) {
    if (this.isValid(x, y)) return;
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
export type Vector = Point;

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
  remove(): void;
  canMove(x: number, y: number): boolean;
  move(x: number, y: number): void;
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

  return { canPlace, points: squares };
}

function translate(points: Point[], vector: Vector) {
  return points.map((pt) => point(pt.x + vector.x, pt.y + vector.y));
}

function rotate(points: Point[], angle: 0 | 90 | 180 | 270 = 90) {
  if (angle === 0) return points;
  return rotate(
    points.map((pt) => point(-pt.y, pt.x)),
    (angle - 90) as 0 | 90 | 180 | 270,
  );
}

function canPlace(grid: Grid, points: Point[], ignorePoints: Point[] = []) {
  return points
    .filter((pt) => !ignorePoints.some((p) => pt.x === p.x && pt.y === p.y))
    .every((pt) => grid.get(pt.x, pt.y) === 'blank');
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
      xmax = pt.x > xmax ? pt.x : xmax;
      ymin = pt.y < ymin ? pt.y : ymin;
      ymax = pt.y > ymax ? pt.y : ymax;
    });
    return { xmin, xmax, ymin, ymax };
  }

  boundingSquare() {
    const { xmin, xmax, ymin, ymax } = this.boundingBox();
    const [dx, dy] = [xmax - xmin + 1, ymax - ymin + 1];
    if (dx == dy) return { xmin, xmax, ymin, ymax };
    else if (dx < dy)
      return {
        xmin: xmin - Math.floor((dy - dx) / 2),
        xmax: xmax + Math.ceil((dy - dx) / 2),
        ymin,
        ymax,
      };
    else
      return {
        xmin,
        xmax,
        ymin: ymin - Math.floor((dx - dy) / 2),
        ymax: ymax + Math.ceil((dx - dy) / 2),
      };
  }

  canRotate(): boolean {
    return canPlace(
      this.grid,
      translate(rotate(this.points), this.position),
      translate(this.points, this.position),
    );
  }

  rotate(): void {
    if (!this.canRotate()) return;
    const box = this.boundingSquare();
    const size = box.xmax - box.xmin + 1;
    this.remove();
    this.points = translate(rotate(this.points), point(size - 1, 0));
    this.spawn();
  }

  canSpawn(): boolean {
    return canPlace(this.grid, translate(this.points, this.position));
  }

  spawn(): void {
    if (!this.canSpawn()) throw new Error('cannot spawn ' + this.name);
    const points = translate(this.points, this.position);
    points.forEach((pt) => this.grid.set(pt.x, pt.y, this.color));
  }

  remove(): void {
    const points = translate(this.points, this.position);
    points.forEach((pt) => this.grid.set(pt.x, pt.y, 'blank'));
  }

  canMove(x: number, y: number): boolean {
    return canPlace(
      this.grid,
      translate(this.points, point(x, y)),
      translate(this.points, this.position),
    );
  }

  move(x: number, y: number): void {
    if (!this.canMove(x, y)) return;
    this.remove();
    this.position = point(x, y);
    this.spawn();
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
    this.currentGroup.move(
      this.currentGroup.position.x - 1,
      this.currentGroup.position.y,
    );
  }

  right() {
    this.setCursor(this.cursor.x + 1, this.cursor.y);
    this.currentGroup.move(
      this.currentGroup.position.x + 1,
      this.currentGroup.position.y,
    );
  }

  up() {
    this.setCursor(this.cursor.x, this.cursor.y - 1);
    this.currentGroup.rotate();
  }

  down() {
    this.setCursor(this.cursor.x, this.cursor.y + 1);
    this.currentGroup.move(
      this.currentGroup.position.x,
      this.currentGroup.position.y + 1,
    );
  }

  space() {
    this.setCursor(this.cursor.x, this.grid.h - 1);
    const group = this.currentGroup;
    const points = translate(group.points, group.position);
    const lower = points.reduce((bound, pt) => {
      const b = bound.get(pt.x);
      if (b == null || pt.y > b) bound.set(pt.x, pt.y);
      return bound;
    }, new Map<number, number>());
    function highest(grid: Grid, column: number, from: number) {
      for (let y = from; y < grid.h; y++) {
        if (grid.get(column, y) !== 'blank') return y;
      }
      return grid.h - 1;
    }
    const min = [...lower.entries()]
      .map(([column, bound]) => highest(this.grid, column, bound + 1) - bound)
      .reduce((a, b) => Math.min(a, b));
    console.log(min);
    this.currentGroup.move(
      this.currentGroup.position.x,
      this.currentGroup.position.y + min,
    );
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
  const group = new GroupT(grid, point(3, 8));
  const tetris = new Tetris(
    grid,
    group,
    group.name,
    null,
    false,
    batch,
    1,
    point(5, 10),
  );
  return tetris;
}
