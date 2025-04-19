export class Ticker {
  private timer: number | null = null;
  private listeners: (() => void)[] = [];

  start(time: number) {
    if (this.timer != null) this.stop();
    this.timer = setInterval(() => {
      this.tick();
    }, time);
  }

  stop() {
    if (this.timer != null) {
      clearInterval(this.timer);
    }
    this.timer = null;
  }

  onTick(fn: () => void) {
    this.listeners.push(fn);
  }

  tick() {
    this.listeners.forEach(fn => fn());
  }
}
