// Gilded Shadows — staged screenshots. Each shot is a real render of the
// game's own code: a fresh world is built from a fixed seed, the rules are
// played forward for a few seconds (or the world state is set directly and
// then rendered), and main.js paints it twice before setting
// window.__shotReady. Nothing here is composited or borrowed.
//
//   ?shot=cover&seed=7   Wren sneaking toward the glowing Star, cones sweeping
//   ?shot=patrol&seed=7  guards on patrol, Wren hidden in a planter
//   ?shot=alarm&seed=7   a near miss: red cone, meter high, guard alerted
//   ?shot=win&seed=7     the win screen with a GHOST rating

import { createWorld, stepWorld } from './world.js';

// Steer the player toward a point for a fixed number of steps, using the
// real rules (walls, guards, detection) the whole way.
function autopilot(world, tx, ty, seconds, sneak) {
  const input = { up: false, down: false, left: false, right: false, sneak };
  const steps = Math.round(seconds * 60);
  for (let i = 0; i < steps; i++) {
    const dx = tx - world.player.x;
    const dy = ty - world.player.y;
    if (Math.hypot(dx, dy) < 24) break;
    input.up = dy < -8;
    input.down = dy > 8;
    input.left = dx < -8;
    input.right = dx > 8;
    stepWorld(world, input, 1 / 60);
    if (world.status !== 'playing') break;
  }
  return world;
}

export function stageShot(name, seed) {
  const world = createWorld(0, seed);

  if (name === 'cover') {
    // Sneak from the spawn toward the artifact's gallery. If the run
    // goes wrong on the way (caught), fall back to a direct placement.
    autopilot(world, 560, 300, 9, true);
    if (world.status !== 'playing') {
      const fresh = createWorld(0, seed);
      fresh.player.x = 560;
      fresh.player.y = 300;
      fresh.player.dir = Math.atan2(200 - 300, 640 - 560);
      fresh.player.sneaking = true;
      return finishCover(fresh);
    }
    world.player.sneaking = true;
    return finishCover(world);
  }

  if (name === 'patrol') {
    // Wren tucked into the planter at (200, 180) while the guards walk
    // their loops; let three seconds of patrol pass so the cones sit
    // mid-sweep.
    world.player.x = 200;
    world.player.y = 180;
    world.player.sneaking = true;
    world.player.dir = Math.atan2(120 - 180, 640 - 200);
    const idle = { up: false, down: false, left: false, right: false, sneak: true };
    for (let i = 0; i < 180; i++) stepWorld(world, idle, 1 / 60);
    return world;
  }

  if (name === 'alarm') {
    // A near miss, staged with the real renderer: Wren caught in the open
    // inside a guard's cone, that guard alerted (red cone, full meter)
    // and closing in, a second guard turning suspicious.
    world.player.x = 760;
    world.player.y = 360;
    world.player.dir = Math.atan2(300 - 360, 640 - 760);
    const g = world.guards[3];
    g.x = 900;
    g.y = 360;
    g.dir = Math.PI; // facing left, straight at Wren
    g.state = 'alerted';
    g.detection = 100;
    g.lastKnown = { x: 760, y: 360 };
    world.everAlerted = true;
    const g2 = world.guards[1];
    g2.state = 'suspicious';
    g2.detection = 62;
    g2.investigate = { x: 760, y: 360 };
    g2.dir = Math.atan2(360 - 420, 760 - 1150);
    return world;
  }

  if (name === 'win') {
    // The win screen as a real player earns it: artifact and loot taken,
    // out through the exit, never once raising the alarm.
    world.artifactTaken = true;
    world.lootTaken = [true, true, true];
    world.lootCount = 3;
    world.score = 500 + 3 * 100 + 150 + 400;
    world.time = 187.4;
    world.levelTime = 52.1;
    world.status = 'won';
    world.ghost = true;
    world.player.x = 1180;
    world.player.y = 90;
    return world;
  }

  // Unknown shot name: the cover is the safe default.
  return stageShot('cover', seed);
}

// The cover wants tension: one guard mid-patrol with its meter half full,
// Wren sneaking in the open with the artifact glowing ahead.
function finishCover(world) {
  const g = world.guards[0];
  g.detection = 46;
  g.state = 'suspicious';
  g.investigate = { x: world.player.x, y: world.player.y };
  g.dir = Math.atan2(world.player.y - g.y, world.player.x - g.x);
  return world;
}
