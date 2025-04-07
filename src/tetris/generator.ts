export function randomBatch<T>(all: T[]): T[] {
  const batch: T[] = [];

  const copy = [...all];
  while (copy.length > 0) {
    const i = Math.floor(Math.random() * copy.length);
    const x = copy.splice(i, 1)[0];
    batch.push(x);
  }

  return batch;
}

export class BatchGenerator<T> {
  private future: T[] = [];
  public readonly horizon: number;
  private batch: T[];

  constructor(batch: T[], horizon?: number) {
    const h = horizon ?? batch.length;
    if (h < 1) throw new Error('horizon must be >= 1');
    this.horizon = h;
    this.batch = [...batch];
    this.init();
  }

  init(): void {
    while (this.future.length < this.horizon) {
      this.appendRandomBatch();
    }
  }

  peek(): T {
    return this.future[0];
  }

  pop(): T {
    const e = this.future.shift()!;
    if (this.future.length < this.horizon) this.appendRandomBatch();
    return e;
  }

  predict(n: number): T[] {
    if (n > this.horizon)
      throw new Error('trying to access more elements that horizon');

    return this.future.slice(0, n);
  }

  get rawbatch() {
    return [...this.batch];
  }

  private appendRandomBatch() {
    this.future.push(...randomBatch(this.batch));
  }
}
