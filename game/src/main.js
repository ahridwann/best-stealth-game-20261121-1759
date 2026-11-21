// Gilded Shadows — boot and the game loop. Two modes:
//
//   * Shot mode (?shot=cover|patrol|alarm|win&seed=N): stage one frame
//     with shots.js, paint it twice, set window.__shotReady. The
//     screenshot tooling waits for that flag.
//   * Play mode: title -> play -> paused / level-clear -> win / lose,
//     fixed 60 Hz steps, sounds drained from world.events each frame.
//
// window.__game exposes the live world and screen for the play-test, and
// window.__shotReady marks a staged frame as painted.

import { createWorld, stepWorld, nextLevel } from './world.js';
import { drawGame } from './render.js';
import { createInput } from './input.js';
import { stageShot } from './shots.js';
import * as audio from './audio.js';

const params = new URLSearchParams(location.search);
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const seed = Number(params.get('seed') || 7);

// --- Shot mode: one staged frame, painted twice, then ready. -----------
if (params.has('shot')) {
  const world = stageShot(params.get('shot'), seed);
  const screen = world.status === 'won' ? 'win' : 'play';
  window.__game = { world, screen, mode: 'shot' };
  drawGame(ctx, world, screen);
  requestAnimationFrame(() => {
    drawGame(ctx, world, screen);
    window.__shotReady = true;
  });
} else {
  // --- Play mode ---------------------------------------------------------
  let screen = 'title'; // title | play | paused | levelclear | win | lose
  let world = createWorld(0, seed);
  let clearT = 0; // seconds the level-clear card has shown

  window.__game = {
    get world() {
      return world;
    },
    get screen() {
      return screen;
    },
    start() {
      screen = 'play';
      input.clearPressed();
    },
    restart() {
      world = createWorld(0, seed);
      screen = 'play';
      input.clearPressed();
    },
  };

  function drainEvents() {
    for (const ev of world.events) {
      if (ev.type === 'step') audio.footstep(ev.running);
      else if (ev.type === 'guardstep') {
        const pan = Math.max(-1, Math.min(1, (ev.guard.x - world.player.x) / 500));
        const dist = Math.hypot(ev.guard.x - world.player.x, ev.guard.y - world.player.y);
        audio.guardStep(pan, dist);
      } else if (ev.type === 'suspicious' || ev.type === 'heard') audio.suspiciousBlip();
      else if (ev.type === 'alarm') audio.alarmSting();
      else if (ev.type === 'pickup') audio.pickupChime();
      else if (ev.type === 'loot') audio.lootChime();
      else if (ev.type === 'win') audio.winFanfare();
      else if (ev.type === 'levelclear') audio.pickupChime();
    }
    world.events.length = 0;
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // Any key or click unlocks audio (browsers require a gesture).
    if (input.pressed('Enter') || input.pressed('Space') || input.pressed('MouseClick')) {
      audio.unlockAudio();
      if (screen === 'title') {
        screen = 'play';
        input.clearPressed();
      } else if (screen === 'levelclear' && clearT > 0.8) {
        world = nextLevel(world);
        screen = 'play';
      }
    }
    if (input.pressed('KeyP') || input.pressed('Escape')) {
      if (screen === 'play') screen = 'paused';
      else if (screen === 'paused') screen = 'play';
    }
    if (input.pressed('KeyR')) {
      // R always restarts the whole run from the first gallery: simple,
      // predictable, and impossible to exploit for a free level reset.
      world = createWorld(0, seed);
      screen = 'play';
      input.clearPressed();
    }

    if (screen === 'play') {
      stepWorld(world, input, dt);
      drainEvents();
      if (world.status === 'won') {
        screen = 'win';
        audio.winFanfare();
      } else if (world.status === 'lost') {
        screen = 'lose';
        audio.loseSting();
      } else if (world.status === 'levelclear') {
        screen = 'levelclear';
        clearT = 0;
      }
    } else if (screen === 'levelclear') {
      clearT += dt;
      if (clearT > 2.2) {
        world = nextLevel(world);
        screen = 'play';
      }
    }

    drawGame(ctx, world, screen);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
