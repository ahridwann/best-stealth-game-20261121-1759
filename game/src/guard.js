// Gilded Shadows — the guards. Each one walks a patrol loop, sees through
// a vision cone, and keeps its own detection meter for the player. The AI
// is a small state machine with a chance to recover at every step:
//
//   patrol     — walk the waypoint loop, pausing at each corner
//   suspicious — something caught the eye (or ear): stop, look, walk over
//                to check it out, look around, then go back to patrol
//   alerted    — the meter filled: chase the player and raise the alarm
//   search     — lost sight of the player: check the last known spot
//   return     — walk back to the nearest waypoint and resume patrol
//
// A guard only fills its meter while the player is inside its cone AND in
// line of sight. Walls and crates block sight, planters hide the player
// unless the guard is very close, and shadow pools slow the fill. Breaking
// line of sight always drains the meter, so a near miss can still be saved.

import { GUARD, PLAYER } from './config.js';
import { moveCircle, losClear, inPlanter } from './level.js';

export function makeGuard(def, tuning) {
  const [sx, sy] = def.waypoints[0];
  const [nx, ny] = def.waypoints[1] ?? def.waypoints[0];
  return {
    x: sx,
    y: sy,
    radius: GUARD.RADIUS,
    waypoints: def.waypoints,
    wp: 1, // next waypoint index
    dirSign: 1, // patrols walk the waypoints out and back, never a diagonal shortcut
    pauseT: 0,
    dir: Math.atan2(ny - sy, nx - sx),
    state: 'patrol',
    detection: 0,
    lastKnown: null, // where the player was last seen
    investigate: null, // point a suspicious guard walks to
    searchT: 0,
    lookT: 0,
    loseSightT: 0,
    noiseCooldown: 0,
    moved: false, // set while walking, so the main loop can play steps
    stepT: 0,
    patrolSpeed: tuning.patrolSpeed,
    chaseSpeed: tuning.chaseSpeed,
    viewRange: tuning.viewRange,
    detectRate: tuning.detectRate,
    viewHalf: GUARD.VIEW_HALF_ANGLE,
  };
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

// Turn toward `target` at most `rate` radians per second.
function turnToward(g, target, rate, dt) {
  let d = target - g.dir;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  const step = Math.max(-rate * dt, Math.min(rate * dt, d));
  g.dir += step;
}

// Walk toward a point at `speed`, facing where we walk. Returns true on
// arrival (within 6 px) or when a wall pins us for too long.
function moveToward(world, g, tx, ty, speed, dt) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 6) return true;
  const before = { x: g.x, y: g.y };
  moveCircle(world.def, g, (dx / dist) * speed * dt, (dy / dist) * speed * dt);
  const movedDist = Math.hypot(g.x - before.x, g.y - before.y);
  g.moved = movedDist > 0.01;
  if (g.moved) {
    turnToward(g, Math.atan2(dy, dx), 9, dt);
    g.stepT -= dt;
    if (g.stepT <= 0) {
      g.stepT = speed > 150 ? 0.3 : 0.48;
      world.events.push({ type: 'guardstep', guard: g });
    }
  }
  return false;
}

function nearestWaypoint(g) {
  let best = 0;
  let bestD = Infinity;
  g.waypoints.forEach(([x, y], i) => {
    const d = (x - g.x) ** 2 + (y - g.y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

export function updateGuard(world, g, dt) {
  const p = world.player;
  const dx = p.x - g.x;
  const dy = p.y - g.y;
  const dist = Math.hypot(dx, dy);
  const toPlayer = Math.atan2(dy, dx);

  // --- Can this guard see the player right now? -------------------------
  const inCone = dist < g.viewRange && angleDiff(g.dir, toPlayer) < g.viewHalf;
  const hiddenByPlanter = inPlanter(world.def, p.x, p.y) && dist > GUARD.HIDE_CLOSE;
  const sees =
    inCone &&
    !hiddenByPlanter &&
    losClear(world.def, g.x, g.y, p.x, p.y);

  // --- Detection meter ---------------------------------------------------
  if (sees) {
    // Closer is scarier: the fill rate runs from 0.6x at the edge of the
    // cone to 1.6x point-blank. Running, light and standing tall all cost.
    let rate = g.detectRate * (1.6 - Math.min(1, dist / g.viewRange));
    if (p.running) rate *= 1.5;
    if (p.sneaking) rate *= 0.55;
    if (p.inShadow) rate *= 0.55;
    g.detection = Math.min(100, g.detection + rate * dt);
    if (g.detection > 0) world.everSpotted = true;
  } else {
    g.detection = Math.max(0, g.detection - GUARD.DETECT_DECAY * dt);
  }

  // --- State changes -----------------------------------------------------
  if (g.detection >= GUARD.ALERTED_AT && g.state !== 'alerted') {
    g.state = 'alerted';
    g.loseSightT = 0;
    world.everAlerted = true;
    world.events.push({ type: 'alarm', guard: g });
  } else if (g.detection >= GUARD.SUSPICIOUS_AT && g.state === 'patrol') {
    g.state = 'suspicious';
    g.pauseT = 0.7;
    g.investigate = { x: p.x, y: p.y };
    world.events.push({ type: 'suspicious', guard: g });
  }

  // A fresh noise ring nearby pulls a patrolling guard over to listen.
  g.noiseCooldown = Math.max(0, g.noiseCooldown - dt);
  if (g.state === 'patrol' && g.noiseCooldown <= 0) {
    for (const n of world.noiseEvents) {
      if (n.t > 0.3 && Math.hypot(n.x - g.x, n.y - g.y) < PLAYER.NOISE_RADIUS) {
        g.state = 'suspicious';
        g.pauseT = 0.4;
        g.investigate = { x: n.x, y: n.y };
        g.noiseCooldown = 2.0;
        world.events.push({ type: 'heard', guard: g });
        break;
      }
    }
  }

  g.moved = false;

  // --- Behaviour ---------------------------------------------------------
  if (g.state === 'patrol') {
    if (g.pauseT > 0) {
      g.pauseT -= dt;
      const [wx, wy] = g.waypoints[g.wp];
      turnToward(g, Math.atan2(wy - g.y, wx - g.x), 3, dt);
    } else {
      const [wx, wy] = g.waypoints[g.wp];
      if (moveToward(world, g, wx, wy, g.patrolSpeed, dt)) {
        // Ping-pong: walk the list out, then back, so every leg is a
        // straight stretch of open floor the level was drawn around.
        g.wp += g.dirSign;
        if (g.wp >= g.waypoints.length) {
          g.dirSign = -1;
          g.wp = g.waypoints.length - 2;
        } else if (g.wp < 0) {
          g.dirSign = 1;
          g.wp = 1;
        }
        g.pauseT = GUARD.WAYPOINT_PAUSE;
      }
    }
  } else if (g.state === 'suspicious') {
    if (g.pauseT > 0) {
      g.pauseT -= dt;
      turnToward(g, Math.atan2(p.y - g.y, p.x - g.x), 5, dt);
    } else if (g.investigate) {
      if (moveToward(world, g, g.investigate.x, g.investigate.y, GUARD.SUSPICIOUS_SPEED, dt)) {
        g.investigate = null;
        g.lookT = 1.4;
      }
    } else if (g.lookT > 0) {
      g.lookT -= dt;
      g.dir += dt * 1.6; // scan the room
      if (g.lookT <= 0) {
        g.state = 'return';
      }
    } else {
      g.state = 'return';
    }
    // Spotted again while investigating: the meter decides, not the state.
    if (sees && g.detection >= GUARD.SUSPICIOUS_AT) {
      g.investigate = { x: p.x, y: p.y };
      g.pauseT = 0;
    }
  } else if (g.state === 'alerted') {
    if (sees) {
      g.loseSightT = 0;
      g.lastKnown = { x: p.x, y: p.y };
    } else {
      g.loseSightT += dt;
    }
    if (g.loseSightT > GUARD.LOSE_SIGHT_AFTER) {
      g.state = 'search';
      g.searchT = 0;
    } else {
      moveToward(world, g, p.x, p.y, g.chaseSpeed, dt);
      if (dist < GUARD.CATCH_RADIUS) {
        world.status = 'lost';
        world.loseReason = 'caught';
      }
    }
  } else if (g.state === 'search') {
    if (g.lastKnown && moveToward(world, g, g.lastKnown.x, g.lastKnown.y, GUARD.SUSPICIOUS_SPEED, dt)) {
      g.lastKnown = null;
    }
    g.searchT += dt;
    g.dir += dt * 1.2; // sweep the area while searching
    if (g.searchT > GUARD.SEARCH_TIME || g.detection <= GUARD.CALM_BELOW) {
      g.state = 'return';
    }
  } else if (g.state === 'return') {
    const i = nearestWaypoint(g);
    const [wx, wy] = g.waypoints[i];
    if (moveToward(world, g, wx, wy, GUARD.RETURN_SPEED, dt)) {
      g.wp = i;
      g.dirSign = i === g.waypoints.length - 1 ? -1 : 1;
      g.state = 'patrol';
      g.detection = Math.min(g.detection, GUARD.CALM_BELOW);
    }
    if (g.detection <= 0 && dist > 200) {
      g.state = 'patrol';
    }
  }
}
