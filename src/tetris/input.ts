import { Tetris } from './tetris';
import { Ticker } from './ticker';

export interface InputHandler {
  attach(el: HTMLElement): boolean;
  detach(): boolean;
}

export type KeyboardCode = KeyboardEvent['code'];

function timeNow() {
  return new Date().getTime();
}

export class Input implements InputHandler {
  private element?: HTMLElement;
  private keydownHandler = (event: KeyboardEvent) => this.press(event);
  private keyupHandler = (event: KeyboardEvent) => this.release(event);
  private readonly ticker = new Ticker();
  private readonly routineInterval = 32;
  private readonly holdBootupTime = 128;
  private holding: Record<KeyboardCode, number | null> = {};

  constructor(readonly tetris: Tetris) {
    this.ticker.onTick(() => this.routine());
  }

  attach(el: HTMLElement): boolean {
    if (this.element != null) return false;

    el.addEventListener('keydown', this.keydownHandler);
    el.addEventListener('keyup', this.keyupHandler);

    this.ticker.start(this.routineInterval);

    return true;
  }

  detach(): boolean {
    if (this.element == null) return true;

    this.element.removeEventListener('keydown', this.keydownHandler);
    this.element.removeEventListener('keyup', this.keyupHandler);

    this.ticker.stop();

    return true;
  }

  routine() {
    const tetris = this.tetris;
    const now = timeNow();
    const limit = this.holdBootupTime;

    const handle = (key: KeyboardCode, limit: number, fn: () => void) => {
      if (!this.holding[key]) return;
      const last = this.holding[key];
      const diff = now - last;
      if (diff > limit) fn();
    };

    handle('ArrowDown', limit, () => tetris.down());
    handle('ArrowLeft', limit, () => tetris.left());
    handle('ArrowRight', limit, () => tetris.right());
  }

  release(event: KeyboardEvent) {
    this.holding[event.code] = null;
  }

  press(event: KeyboardEvent) {
    const tetris = this.tetris;

    if (this.holding[event.code]) return;

    switch (event.code) {
      case 'ArrowUp':
        if (event.shiftKey) tetris.shiftUp();
        else tetris.up();
        break;

      case 'ArrowDown':
        tetris.down();
        break;

      case 'ArrowLeft':
        tetris.left();
        break;

      case 'ArrowRight':
        tetris.right();
        break;

      case 'Space':
        tetris.space();
        break;

      case 'KeyC':
        tetris.swap();
        break;

      case 'Tab':
        tetris.cycle();
        break;

      default:
        return;
    }

    this.holding[event.code] = timeNow();
    event.preventDefault();
  }
}
