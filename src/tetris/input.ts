import { Tetris } from './tetris';
import { Ticker } from './ticker';

export type Action =
  | 'down'
  | 'left'
  | 'right'
  | 'up'
  | 'space'
  | 'c'
  | 'x'
  | 'tab';
export type KeyboardCode = KeyboardEvent['code'];
export type Keybind = Record<Action, KeyboardCode>;

export interface InputHandler {
  tetris: Tetris;
  attach(el: HTMLElement): boolean;
  detach(): boolean;
  resetKeybind(): void;
  setKeybind(action: Action, key: KeyboardCode): void;
  getKeybind(): Keybind;
}

function timeNow() {
  return new Date().getTime();
}

export class Input implements InputHandler {
  static readonly DefautKeybind = {
    down: 'ArrowDown',
    up: 'ArrowUp',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    space: 'Space',
    c: 'KeyC',
    x: 'KeyX',
    tab: 'Tab',
  };

  private element?: HTMLElement;
  private keydownHandler = (event: KeyboardEvent) => this.press(event);
  private keyupHandler = (event: KeyboardEvent) => this.release(event);
  private readonly ticker = new Ticker();
  private readonly routineInterval = 32;
  private readonly holdBootupTime = 128;
  private holding: Record<KeyboardCode, number | null> = {};
  private keybind = { ...Input.DefautKeybind };

  constructor(public tetris: Tetris) {
    this.ticker.onTick(() => this.routine());
  }

  attach(el: HTMLElement): boolean {
    if (this.element != null) return false;

    el.addEventListener('keydown', this.keydownHandler);
    el.addEventListener('keyup', this.keyupHandler);
    this.element = el;

    this.ticker.start(this.routineInterval);

    return true;
  }

  detach(): boolean {
    if (this.element == null) return true;

    this.element.removeEventListener('keydown', this.keydownHandler);
    this.element.removeEventListener('keyup', this.keyupHandler);
    this.element = undefined;

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

    handle(this.keybind.down, limit, () => tetris.down());
    handle(this.keybind.left, limit, () => tetris.left());
    handle(this.keybind.right, limit, () => tetris.right());
  }

  release(event: KeyboardEvent) {
    this.holding[event.code] = null;
  }

  press(event: KeyboardEvent) {
    const tetris = this.tetris;

    if (this.holding[event.code]) {
      event.preventDefault();
      return;
    }

    switch (event.code) {
      case this.keybind.up:
        if (event.shiftKey) tetris.shiftUp();
        else tetris.up();
        break;

      case this.keybind.down:
        tetris.down();
        break;

      case this.keybind.left:
        tetris.left();
        break;

      case this.keybind.right:
        tetris.right();
        break;

      case this.keybind.space:
        tetris.space();
        break;

      case this.keybind.c:
        tetris.swap();
        break;

      case this.keybind.x:
        tetris.dive();
        break;

      case this.keybind.tab:
        tetris.cycle();
        break;

      default:
        return;
    }

    this.holding[event.code] = timeNow();
    event.preventDefault();
  }

  resetKeybind() {
    this.keybind = { ...Input.DefautKeybind };
  }

  setKeybind(action: Action, key: KeyboardCode) {
    this.keybind[action] = key;
  }

  getKeybind() {
    return { ...this.keybind };
  }
}
