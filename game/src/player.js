// Gilded Shadows — Wren, the player. Movement, sneaking, and the noise
// running makes. Nothing here draws or listens to keys: main.js owns the
// loop and input.js owns the keyboard; this file only turns an input state
// into a new player position once per step.

import { PLAYER } from './config.js';
import { moveCircle, inPlanter, inShadow } from './level.js';

export function makePlayer(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    radius: PLAYER.RADIUS,
    dir: 0, // facing angle, radians
    moving: false,
    sneaking: false,
    running: false,
    noiseT: 0, // countdown to the next noise ring while running
    hidden: false, // inside a planter
    inShadow: false,
    stepT: 0, // countdown to the next footstep sound
  };
}

export function updatePlayer(world, input, dt) {
  const p = world.player;
  const def = world.def;

  let ix = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let iy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const len = Math.hypot(ix, iy);
  p.moving = len > 0;
  p.sneaking = Boolean(input.sneak);
  // Running means moving without sneaking: faster, but loud.
  p.running = p.moving && !p.sneaking;
  const speed = p.sneaking ? PLAYER.SNEAK : p.running ? PLAYER.RUN : PLAYER.WALK;

  if (p.moving) {
    ix /= len;
    iy /= len;
    p.dir = Math.atan2(iy, ix);
    moveCircle(def, p, ix * speed * dt, iy * speed * dt);
  }

  p.hidden = inPlanter(def, p.x, p.y);
  p.inShadow = inShadow(def, p.x, p.y);

  // Running leaves expanding rings of noise that guards can hear.
  if (p.running) {
    p.noiseT -= dt;
    if (p.noiseT <= 0) {
      p.noiseT = PLAYER.NOISE_EVERY;
      world.noiseEvents.push({ x: p.x, y: p.y, r: PLAYER.NOISE_RADIUS, t: 0.55, max: 0.55 });
    }
  } else {
    p.noiseT = 0;
  }

  // Footstep timing, so the sound follows the gait: quick when running,
  // unhurried when sneaking.
  if (p.moving) {
    p.stepT -= dt;
    if (p.stepT <= 0) {
      p.stepT = p.running ? 0.24 : p.sneaking ? 0.5 : 0.34;
      world.events.push({ type: 'step', running: p.running });
    }
  }
}
