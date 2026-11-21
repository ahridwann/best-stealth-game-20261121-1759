// Gilded Shadows — keyboard and mouse. Held keys steer Wren, one-shot
// keys confirm, pause and restart. The input object is plain state: the
// world reads it every step, main.js consumes the one-shot presses.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set(); // one-shot presses, consumed by main.js

  const input = {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
  };

  function sync() {
    input.up = keys.has('ArrowUp') || keys.has('KeyW');
    input.down = keys.has('ArrowDown') || keys.has('KeyS');
    input.left = keys.has('ArrowLeft') || keys.has('KeyA');
    input.right = keys.has('ArrowRight') || keys.has('KeyD');
    input.sneak = keys.has('ShiftLeft') || keys.has('ShiftRight');
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault(); // keep the page from scrolling while playing
    }
    if (!e.repeat) pressed.add(e.code);
    keys.add(e.code);
    sync();
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
    sync();
  });
  window.addEventListener('blur', () => {
    keys.clear();
    sync();
  });
  canvas.addEventListener('mousedown', () => pressed.add('MouseClick'));

  // True once for a key pressed since the last check, then forgotten.
  input.pressed = (code) => {
    if (!pressed.has(code)) return false;
    pressed.delete(code);
    return true;
  };
  input.clearPressed = () => pressed.clear();

  return input;
}
