import { Tetris } from './tetris';

export interface InputHandler {
  attach(el: HTMLElement): boolean;
  detach(): boolean;
}

export class Input implements InputHandler {
  private element?: HTMLElement;
  private keydownHandler = (event: KeyboardEvent) => this.handleInput(event);
  private keyupHandler = (event: KeyboardEvent) => this.handleInput(event);
  constructor(readonly tetris: Tetris) {}

  attach(el: HTMLElement): boolean {
    if (this.element != null) return false;

    el.addEventListener('keydown', this.keydownHandler);
    // el.addEventListener('keyup', this.keyupHandler);

    return true;
  }

  detach(): boolean {
    if (this.element == null) return true;

    this.element.removeEventListener('keydown', this.keydownHandler);
    // this.element.removeEventListener('keyup', this.keyupHandler);

    return true;
  }

  handleInput(event: KeyboardEvent) {
    const tetris = this.tetris;
    if (!tetris) return;

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

    event.preventDefault();
  }
}
