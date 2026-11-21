// Gilded Shadows — the rules and the state. No drawing and no browser
// here: step() takes the world and an input state and advances one tick.
// The renderer reads this state, and main.js turns its events into sound.
//
// A run: steal the Star of Meridian, grab what loot you dare, reach the
// green exit. Clearing a level loads the next one with the score, time and
// loot carried over; clearing the third wins the run. Getting caught ends
// it. A run that no guard ever raised the alarm on earns GHOST.

import { LEVEL_TUNING, PLAYER, SCORE } from './config.js';
import { getLevel, pointInRect } from './level.js';
import { makePlayer, updatePlayer } from './player.js';
import { makeGuard, updateGuard } from './guard.js';

export function createWorld(levelIndex, seed, carry) {
  const def = getLevel(levelIndex);
  const tuning = LEVEL_TUNING[levelIndex % LEVEL_TUNING.length];
  const c = carry ?? { score: 0, time: 0, lootCount: 0, everAlerted: false };
  return {
    levelIndex,
    def,
    seed,
    time: c.time, // total run time, carried across levels
    levelTime: 0, // time on this level only
    score: c.score,
    lootCount: c.lootCount,
    status: 'playing', // playing | levelclear | won | lost
    loseReason: '', // 'caught'
    player: makePlayer(def.spawn),
    guards: def.guards.map((g) => makeGuard(g, tuning)),
    artifactTaken: false,
    lootTaken: def.loot.map(() => false),
    everAlerted: c.everAlerted,
    everSpotted: false,
    noiseEvents: [], // {x, y, r, t, max} — expanding rings, drawn + heard
    events: [], // one-frame messages for sound: step, guardstep, alarm...
    ghost: false, // set on the win screen
  };
}

// The highest detection meter among the guards: the HUD's alert eye.
export function alertLevel(world) {
  let top = 0;
  for (const g of world.guards) top = Math.max(top, g.detection);
  return top;
}

export function stepWorld(world, input, dt) {
  if (world.status !== 'playing') return;
  world.time += dt;
  world.levelTime += dt;

  updatePlayer(world, input, dt);
  for (const g of world.guards) updateGuard(world, g, dt);
  if (world.status !== 'playing') return; // a guard may have caught Wren

  // Age the noise rings; they fade out and stop being heard.
  for (const n of world.noiseEvents) n.t -= dt;
  world.noiseEvents = world.noiseEvents.filter((n) => n.t > 0);

  // Pick up the Star of Meridian.
  if (!world.artifactTaken) {
    const d = Math.hypot(world.player.x - world.def.artifact.x, world.player.y - world.def.artifact.y);
    if (d < PLAYER.PICKUP_RADIUS) {
      world.artifactTaken = true;
      world.score += SCORE.ARTIFACT;
      world.events.push({ type: 'pickup' });
    }
  }

  // Optional loot gems.
  world.def.loot.forEach((gem, i) => {
    if (world.lootTaken[i]) return;
    const d = Math.hypot(world.player.x - gem.x, world.player.y - gem.y);
    if (d < PLAYER.LOOT_RADIUS) {
      world.lootTaken[i] = true;
      world.lootCount += 1;
      world.score += SCORE.LOOT;
      world.events.push({ type: 'loot' });
    }
  });

  // The exit only opens once the artifact is stolen.
  if (world.artifactTaken && pointInRect(world.player.x, world.player.y, world.def.exit)) {
    world.score += SCORE.LEVEL_CLEAR;
    if (world.levelIndex >= 2) {
      world.status = 'won';
      world.ghost = !world.everAlerted;
      if (world.ghost) world.score += SCORE.GHOST_BONUS;
      world.events.push({ type: 'win' });
    } else {
      world.status = 'levelclear';
      world.events.push({ type: 'levelclear' });
    }
  }
}

// Start the next level after a clear, carrying score, time, loot and the
// alarm history (a GHOST run must stay clean across all three levels).
export function nextLevel(world) {
  return createWorld(world.levelIndex + 1, world.seed, {
    score: world.score,
    time: world.time,
    lootCount: world.lootCount,
    everAlerted: world.everAlerted,
  });
}

export function formatTime(seconds) {
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
