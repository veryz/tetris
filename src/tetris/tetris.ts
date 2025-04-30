import { BatchGenerator } from './generator';
import { Ticker } from './ticker';

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

  isLine(y: number) {
    this.validate(0, y);
    return [...new Array(this.w)].every((_, i) => this.grid[i][y] !== 'blank');
  }

  clear() {
    for (let x = 0; x < this.grid.length; x++) {
      for (let y = 0; y < this.grid[x].length; y++) {
        this.grid[x][y] = 'blank';
      }
    }
  }

  clearLines() {
    for (
      let insert = this.h - 1, scan = this.h - 1;
      insert >= 0 && scan >= 0;
      scan--
    ) {
      if (this.isLine(scan)) {
        [...new Array(this.w)].forEach(
          (_, i) => (this.grid[i][scan] = 'blank'),
        );
      } else if (insert !== scan) {
        [...new Array(this.w)].forEach(
          (_, i) => (
            (this.grid[i][insert] = this.grid[i][scan]),
            (this.grid[i][scan] = 'blank')
          ),
        );
        insert--;
      } else insert--;
    }
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
  color: Color;
  points: Point[];
  position: Position;
  canRotate(): boolean;
  rotate(): void;
  canSpawn(): boolean;
  spawn(): void;
  fill(): void;
  overwrite(): void;
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

function boundingBox(points: Point[]) {
  let [xmin, xmax, ymin, ymax]: (number | undefined)[] = [];
  points.forEach(pt => {
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

function boundingSquare(points: Point[]) {
  const { xmin, xmax, ymin, ymax } = boundingBox(points);
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

function canPlace(grid: Grid, points: Point[], ignorePoints: Point[] = []) {
  return points
    .filter(pt => !ignorePoints.some(p => pt.x === p.x && pt.y === p.y))
    .every(pt => grid.isValid(pt.x, pt.y) && grid.get(pt.x, pt.y) === 'blank');
}

function findPlace(
  grid: Grid,
  points: Point[],
  position: Point,
  ignorePoints: Point[],
) {
  const box = boundingBox(points);

  const leftDelta = -box.xmin;
  const packLeft = translate(points, point(leftDelta, 0));
  const rightDelta = grid.w - box.xmax - 1;
  const packRight = translate(points, point(rightDelta, 0));

  if (box.xmin < 0 && canPlace(grid, packLeft, ignorePoints)) {
    return point(0, position.y);
  } else if (box.xmax >= grid.w && canPlace(grid, packRight, ignorePoints)) {
    return point(position.x + rightDelta, position.y);
  }

  return undefined;
}

function raycast(grid: Grid, column: number, from: number) {
  for (let y = from; y < grid.h; y++) {
    if (grid.get(column, y) !== 'blank') return y;
  }
  return grid.h;
}

function smartRotate(grid: Grid, points: Point[], position: Point) {
  const box = boundingSquare(points);
  const size = box.xmax - box.xmin + 1;

  const rotated = translate(rotate(points), point(size - 1, 0));
  const ignore = translate(points, position);
  const origin = findPlace(
    grid,
    translate(rotated, position),
    position,
    ignore,
  );

  return { relative: rotated, origin };
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
    return boundingBox(this.relpoints);
  }

  boundingSquare(): Box {
    return boundingSquare(this.relpoints);
  }

  canRotate(): boolean {
    return this.transform(
      ({ relative }) => smartRotate(this.grid, relative, this.position),
      true,
    );
  }

  rotate(): void {
    this.transform(
      ({ relative }) => smartRotate(this.grid, relative, this.position),
      false,
    );
  }

  canSpawn(): boolean {
    return canPlace(this.grid, this.points);
  }

  spawn(): void {
    if (!this.canSpawn()) throw new Error('cannot spawn ' + this.name);
    this.points.forEach(pt => this.grid.set(pt.x, pt.y, this.color));
  }

  fill(): void {
    this.points.forEach(pt => {
      if (this.grid.get(pt.x, pt.y) === 'blank')
        this.grid.set(pt.x, pt.y, this.color);
    });
  }

  overwrite(): void {
    this.points.forEach(pt => this.grid.set(pt.x, pt.y, this.color));
  }

  remove(): void {
    this.points.forEach(pt => this.grid.set(pt.x, pt.y, 'blank'));
  }

  canMove(x: number, y: number): boolean {
    return this.transform(() => ({ origin: point(x, y) }), true);
  }

  move(x: number, y: number): void {
    this.transform(() => ({ origin: point(x, y) }), false);
  }

  transform(
    fn: (initial: { origin: Point; relative: Point[] }) => {
      origin?: Point;
      relative?: Point[];
    },
    simulate: boolean,
  ): boolean {
    const {
      origin: position = this.position,
      relative: points = this.relpoints,
    } = fn({
      origin: this.position,
      relative: this.relpoints,
    });
    const grid = this.grid;
    const curr = this.points;
    const next = translate(points, position);
    if (!canPlace(grid, next, curr)) return false;

    if (!simulate) {
      this.remove();
      this.position = point(position.x, position.y);
      this.relpoints = points.map(p => point(p.x, p.y));
      this.spawn();
    }

    return true;
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

interface Controller {
  left(): void;
  right(): void;
  up(): void;
  down(): void;
  shiftUp(): void;
  cycle(): void;
  dive(): void;
  space(): void;
  swap(): void;
}

export class Tetris {
  public grid = new Grid(10, 20);
  private generator = new BatchGenerator<Piece>(this.pieces);
  private group: Group;
  public memory: Piece | null = null;
  public usedMemory: boolean = false;
  public finished: boolean = false;
  private controller: Controller;
  private ticker = new Ticker();
  private listeners: ((tetris: Tetris) => void)[] = [];
  private readonly tickInterval = 1000;

  constructor(public speed: number) {
    // Start with a dummy group
    this.group = group('T', this.grid, point(0, 0));
    this.init();

    this.controller = this.gameControls;
  }

  init() {
    this.ticker.onTick(() => this.tick());
    this.next();
  }

  start() {
    this.ticker.start(this.tickInterval);
    this.notify();
  }

  stop() {
    this.ticker.stop();
    this.notify();
  }

  onUpdate(fn: (tetris: Tetris) => void) {
    this.listeners.push(fn);
  }

  notify() {
    this.listeners.forEach(fn => fn(this));
  }

  next() {
    // Clear lines
    this.grid.clearLines();

    // Clear memory
    this.usedMemory = false;

    // Spawn piece
    const piece = this.generator.pop();
    this.spawn(piece);
    this.notify();
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
      this.refreshTimer();
    } else {
      g.overwrite();
      this.finished = true;
      this.controller = this.finishedControls;
      this.ticker.stop();
    }
  }

  refreshTimer() {
    this.ticker.stop();
    this.ticker.start(this.tickInterval);
  }

  left(): void {
    this.controller.left();
  }
  right(): void {
    this.controller.right();
  }
  up(): void {
    this.controller.up();
  }
  down(): void {
    this.controller.down();
  }
  shiftUp(): void {
    this.controller.shiftUp();
  }
  cycle(): void {
    this.controller.cycle();
  }
  dive(): void {
    this.controller.dive();
  }
  space(): void {
    this.controller.space();
  }
  swap(): void {
    this.controller.swap();
  }

  // BEGIN Player actions
  gameControls = new (class implements Controller {
    constructor(private tetris: Tetris) {}

    left() {
      this.tetris.group.move(
        this.tetris.group.position.x - 1,
        this.tetris.group.position.y,
      );
      this.tetris.notify();
    }

    right() {
      this.tetris.group.move(
        this.tetris.group.position.x + 1,
        this.tetris.group.position.y,
      );
      this.tetris.notify();
    }

    up() {
      this.tetris.group.rotate();
      this.tetris.notify();
    }

    shiftUp() {
      this.tetris.group.move(
        this.tetris.group.position.x,
        this.tetris.group.position.y - 1,
      );
      this.tetris.notify();
    }

    down() {
      this.tetris.group.move(
        this.tetris.group.position.x,
        this.tetris.group.position.y + 1,
      );
      this.tetris.refreshTimer();
      this.tetris.notify();
    }

    cycle() {
      const pieces = this.tetris.pieces;
      const next = group(
        pieces[
          (1 + pieces.findIndex(p => p === this.tetris.group.name)) %
            pieces.length
        ],
        this.tetris.grid,
        this.tetris.group.position,
      );

      if (!canPlace(this.tetris.grid, next.points, this.tetris.group.points))
        return;
      this.tetris.group.remove();
      next.spawn();
      this.tetris.group = next;
      this.tetris.notify();
    }

    dive() {
      this.tetris.group.move(
        this.tetris.group.position.x,
        this.tetris.group.position.y + this.tetris.group.distance,
      );
      this.tetris.refreshTimer();
      this.tetris.notify();
    }

    space() {
      this.tetris.group.move(
        this.tetris.group.position.x,
        this.tetris.group.position.y + this.tetris.group.distance,
      );
      this.tetris.next();
      this.tetris.notify();
    }

    swap() {
      if (this.tetris.usedMemory) return;

      const piece = this.tetris.memory;
      this.tetris.group.remove();
      this.tetris.memory = this.tetris.group.name;
      this.tetris.usedMemory = true;
      this.tetris.spawn(piece ?? this.tetris.generator.pop());
      this.tetris.notify();
    }
  })(this);
  // END Player actions

  // BEGIN Finished actions
  finishedControls = new (class implements Controller {
    constructor() {}
    left(): void {}
    right(): void {}
    up(): void {}
    down(): void {}
    shiftUp(): void {}
    cycle(): void {}
    dive(): void {}
    space(): void {}
    swap(): void {}
  })();
  // END Finished actions

  reset() {
    this.grid.clear();
    this.controller = this.gameControls;
    this.finished = false;
  }

  tick() {
    if (this.group.canMove(this.group.position.x, this.group.position.y + 1))
      this.group.move(this.group.position.x, this.group.position.y + 1);
    else this.next();
    this.notify();
  }

  nextPieces(n: number) {
    return this.generator.predict(n);
  }

  isPaused() {
    return !this.finished && !this.ticker.isRunning();
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

export function newTetris() {
  const tetris = new Tetris(1);
  return tetris;
}
