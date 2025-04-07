import { BatchGenerator } from './generator';

const COLORS = [
  'red',
  'blue',
  'green',
  'yellow',
  'purple',
  'orange',
  'cyan',
  'blank',
] as const;
export type Color = (typeof COLORS)[number];

function randomColor() {
  const all = COLORS;
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
    return 0 <= x && x < this.w && 0 <= y && y < this.h;
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

const PIECES = ['L', 'J', 'I', 'O', 'S', 'Z', 'T'] as const;
export type Piece = (typeof PIECES)[number];

export interface Point {
  x: number;
  y: number;
}

export type Position = Point;
export type Vector = Point;

function point(x: number, y: number): Point {
  return { x, y };
}

export interface Box {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

export interface Group {
  name: Piece;
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
  boundingBox(): Box;
  projected: Point[];
  distance: number;
}

function translate(points: Point[], vector: Vector) {
  return points.map(pt => point(pt.x + vector.x, pt.y + vector.y));
}

function rotate(points: Point[], angle: 0 | 90 | 180 | 270 = 90) {
  if (angle === 0) return points;
  return rotate(
    points.map(pt => point(-pt.y, pt.x)),
    (angle - 90) as 0 | 90 | 180 | 270,
  );
}

function canPlace(grid: Grid, points: Point[], ignorePoints: Point[] = []) {
  return points
    .filter(pt => !ignorePoints.some(p => pt.x === p.x && pt.y === p.y))
    .every(pt => grid.isValid(pt.x, pt.y) && grid.get(pt.x, pt.y) === 'blank');
}

function raycast(grid: Grid, column: number, from: number) {
  for (let y = from; y < grid.h; y++) {
    if (grid.get(column, y) !== 'blank') return y;
  }
  return grid.h;
}

abstract class AbstractGroup implements Group {
  constructor(
    public grid: Grid,
    public relpoints: Point[],
    public position: Position,
    public name: Piece,
    public color: Color,
  ) {}

  boundingBox(): Box {
    let [xmin, xmax, ymin, ymax]: (number | undefined)[] = [];
    this.relpoints.forEach(pt => {
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

  boundingSquare(): Box {
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
    const square = this.boundingSquare();
    const size = square.xmax - square.xmin + 1;

    return canPlace(
      this.grid,
      translate(
        rotate(this.relpoints),
        point(this.position.x + size - 1, this.position.y),
      ),
      this.points,
    );
  }

  rotate(): void {
    if (!this.canRotate()) return;
    const square = this.boundingSquare();
    const size = square.xmax - square.xmin + 1;

    this.remove();
    this.relpoints = translate(rotate(this.relpoints), point(size - 1, 0));
    this.spawn();
  }

  canSpawn(): boolean {
    return canPlace(this.grid, this.points);
  }

  spawn(): void {
    if (!this.canSpawn()) throw new Error('cannot spawn ' + this.name);
    this.points.forEach(pt => this.grid.set(pt.x, pt.y, this.color));
  }

  remove(): void {
    this.points.forEach(pt => this.grid.set(pt.x, pt.y, 'blank'));
  }

  canMove(x: number, y: number): boolean {
    return canPlace(
      this.grid,
      translate(this.relpoints, point(x, y)),
      this.points,
    );
  }

  move(x: number, y: number): void {
    if (!this.canMove(x, y)) return;
    this.remove();
    this.position = point(x, y);
    this.spawn();
  }

  get points() {
    return translate(this.relpoints, this.position);
  }

  get distance() {
    const lower = this.points.reduce((bound, pt) => {
      const b = bound.get(pt.x);
      if (b == null || pt.y > b) bound.set(pt.x, pt.y);
      return bound;
    }, new Map<number, number>());

    const min = [...lower.entries()]
      .map(
        ([column, bound]) => raycast(this.grid, column, bound + 1) - bound - 1,
      )
      .reduce((a, b) => Math.min(a, b));

    return Math.max(0, min);
  }

  get projected() {
    return translate(this.points, point(0, this.distance));
  }
}

class GroupT extends AbstractGroup {
  constructor(grid: Grid, position: Point) {
    const points = [point(1, 0), point(0, 1), point(1, 1), point(2, 1)];
    super(grid, points, position, 'T', 'purple');
  }
}

class GroupI extends AbstractGroup {
  constructor(grid: Grid, position: Point) {
    const points = [point(1, 0), point(1, 1), point(1, 2), point(1, 3)];
    super(grid, points, position, 'I', 'cyan');
  }
}

class GroupL extends AbstractGroup {
  constructor(grid: Grid, position: Point) {
    const points = [point(2, 0), point(0, 1), point(1, 1), point(2, 1)];
    super(grid, points, position, 'L', 'orange');
  }
}

class GroupJ extends AbstractGroup {
  constructor(grid: Grid, position: Point) {
    const points = [point(0, 0), point(0, 1), point(1, 1), point(2, 1)];
    super(grid, points, position, 'J', 'blue');
  }
}

class GroupO extends AbstractGroup {
  constructor(grid: Grid, position: Point) {
    const points = [point(0, 0), point(1, 0), point(0, 1), point(1, 1)];
    super(grid, points, position, 'O', 'yellow');
  }
}

class GroupS extends AbstractGroup {
  constructor(grid: Grid, position: Point) {
    const points = [point(1, 0), point(2, 0), point(0, 1), point(1, 1)];
    super(grid, points, position, 'S', 'green');
  }
}

class GroupZ extends AbstractGroup {
  constructor(grid: Grid, position: Point) {
    const points = [point(0, 0), point(1, 0), point(1, 1), point(2, 1)];
    super(grid, points, position, 'Z', 'red');
  }
}

const GROUPS: Record<Piece, { new (grid: Grid, position: Point): Group }> = {
  L: GroupL,
  J: GroupJ,
  I: GroupI,
  O: GroupO,
  S: GroupS,
  Z: GroupZ,
  T: GroupT,
};

export function group(piece: Piece, grid: Grid, position: Point) {
  const clazz = GROUPS[piece];
  if (!clazz) throw new Error(`no group exists for piece ${piece}`);
  return new clazz(grid, position);
}

export class Tetris {
  private generator = new BatchGenerator<Piece>(this.pieces);
  private group: Group;
  public memory: Piece | null = null;
  public usedMemory: boolean = false;

  constructor(
    public grid: Grid,
    public speed: number,
  ) {
    // Start with a dummy group
    this.group = group('T', this.grid, point(0, 0));
    this.init();
  }

  init() {
    this.next();
  }

  next() {
    // Clear lines

    // Clear memory
    this.usedMemory = false;

    // Spawn piece
    const piece = this.generator.pop();
    this.spawn(piece);
  }

  spawn(piece: Piece) {
    // Create piece
    const g = group(piece, this.grid, point(0, 0));

    // Move piece to the center
    const box = g.boundingBox();
    const dx = Math.floor((this.grid.w - (box.xmax - box.xmin + 1)) / 2);
    g.position = translate([g.position], point(dx, 0))[0];

    // Spawn piece
    if (g.canSpawn()) {
      g.spawn();
      this.group = g;
    } else {
      console.log('you lost!');
    }
  }

  // BEGIN Player actions

  left() {
    this.group.move(this.group.position.x - 1, this.group.position.y);
  }

  right() {
    this.group.move(this.group.position.x + 1, this.group.position.y);
  }

  up() {
    this.group.rotate();
  }

  shiftUp() {
    this.group.move(this.group.position.x, this.group.position.y - 1);
  }

  down() {
    this.group.move(this.group.position.x, this.group.position.y + 1);
  }

  cycle() {
    const pieces = this.pieces;
    const next = group(
      pieces[
        (1 + pieces.findIndex(p => p === this.group.name)) % pieces.length
      ],
      this.grid,
      this.group.position,
    );

    if (!canPlace(this.grid, next.points, this.group.points)) return;
    this.group.remove();
    next.spawn();
    this.group = next;
  }

  space() {
    this.group.move(
      this.group.position.x,
      this.group.position.y + this.group.distance,
    );
    this.next();
  }

  swap() {
    if (this.usedMemory) return;

    const piece = this.memory;
    this.group.remove();
    this.memory = this.group.name;
    this.usedMemory = true;
    this.spawn(piece ?? this.generator.pop());
  }

  // END Player actions

  tick() {
    if (this.group.canMove(this.group.position.x, this.group.position.y + 1))
      this.group.move(this.group.position.x, this.group.position.y + 1);
    else this.next();
  }

  nextPieces(n: number) {
    return this.generator.predict(n);
  }

  get currentGroup() {
    return this.group;
  }

  static get colors() {
    return [...COLORS];
  }
  get colors() {
    return Tetris.colors;
  }

  static get pieces() {
    return [...PIECES];
  }
  get pieces() {
    return Tetris.pieces;
  }
}

export function randomTetris() {
  console.log('creating a random tetris!');
  const grid = new Grid(10, 20);
  const tetris = new Tetris(grid, 1);
  return tetris;
}
