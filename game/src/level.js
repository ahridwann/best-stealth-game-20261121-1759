// Gilded Shadows — the three museum levels and every spatial question the
// rules ask about them: what blocks movement, what blocks sight, where the
// player is hidden, where it is dark.
//
// A level is plain data: axis-aligned wall rectangles (they block movement
// and sight), crates and pedestals (same, smaller), planters (hide spots —
// they do NOT block movement, the player slips inside them), shadow pools
// (dark ellipses that slow detection), lamps and paintings (looks only),
// guards with patrol waypoint loops, the artifact, optional loot, the exit
// door and the player's spawn point.
//
// Layout rule used while placing every wall: the spawn, the artifact and
// the exit are always connected by a path that never crosses a wall, and
// every guard waypoint loop stays inside open floor. The play-test in the
// browser (and the node smoke test in /tmp) checks both.

import { FIELD } from './config.js';

function borderWalls() {
  return [
    { x: 0, y: 56, w: 1280, h: 8 }, // under the HUD strip
    { x: 0, y: 708, w: 1280, h: 12 },
    { x: 0, y: 56, w: 12, h: 652 },
    { x: 1268, y: 56, w: 12, h: 652 },
  ];
}

export const LEVELS = [
  {
    name: 'The Gallery',
    subtitle: 'Level 1 — learn the patrols, mind the light',
    walls: [
      ...borderWalls(),
      { x: 300, y: 56, w: 16, h: 124 }, // gap 180..380 to slip through
      { x: 300, y: 380, w: 16, h: 328 },
      { x: 700, y: 220, w: 16, h: 488 }, // gap above, y 64..220
      { x: 560, y: 480, w: 360, h: 16 },
      { x: 980, y: 56, w: 16, h: 160 }, // gap below, y 216..
    ],
    crates: [
      { x: 460, y: 140, w: 44, h: 44 },
      { x: 860, y: 640, w: 44, h: 44 },
      { x: 1120, y: 520, w: 44, h: 44 },
      { x: 180, y: 560, w: 44, h: 44 },
      { x: 1020, y: 180, w: 44, h: 44 },
    ],
    pedestals: [
      { x: 622, y: 182, w: 36, h: 36 }, // the Star of Meridian stands here
      { x: 240, y: 640, w: 40, h: 40 },
      { x: 1060, y: 140, w: 40, h: 40 },
    ],
    planters: [
      { x: 200, y: 180, r: 34 },
      { x: 520, y: 120, r: 34 },
      { x: 900, y: 560, r: 34 },
      { x: 1080, y: 300, r: 34 },
      { x: 640, y: 640, r: 34 },
    ],
    shadows: [
      { x: 640, y: 600, rx: 95, ry: 60 },
      { x: 1000, y: 150, rx: 85, ry: 60 },
      { x: 180, y: 480, rx: 85, ry: 60 },
      { x: 1160, y: 640, rx: 80, ry: 50 },
    ],
    lamps: [
      { x: 640, y: 120, r: 130 },
      { x: 180, y: 300, r: 120 },
      { x: 1100, y: 180, r: 120 },
      { x: 900, y: 640, r: 120 },
    ],
    paintings: [
      { x: 330, y: 64, w: 70, h: 46, color: '#7a4a3a' },
      { x: 720, y: 300, w: 60, h: 80, color: '#3a5a7a' },
      { x: 1000, y: 64, w: 70, h: 46, color: '#4a7a3a' },
      { x: 560, y: 500, w: 80, h: 44, color: '#7a6a3a' },
    ],
    guards: [
      { waypoints: [[140, 220], [500, 220], [500, 320], [140, 320]] },
      { waypoints: [[820, 120], [940, 120], [940, 420], [1150, 420]] },
      { waypoints: [[360, 560], [660, 560], [660, 660], [360, 660]] },
      { waypoints: [[760, 300], [1150, 300], [1150, 430], [760, 430]] },
    ],
    artifact: { x: 640, y: 200 },
    loot: [
      { x: 150, y: 120 },
      { x: 1150, y: 620 },
      { x: 860, y: 120 },
    ],
    exit: { x: 1180, y: 76, w: 56, h: 64 },
    spawn: { x: 80, y: 640 },
  },
  {
    name: 'The Vault',
    subtitle: 'Level 2 — five guards, tighter light, no easy route',
    walls: [
      ...borderWalls(),
      { x: 240, y: 56, w: 16, h: 180 }, // gap 236..420
      { x: 240, y: 420, w: 16, h: 288 },
      { x: 560, y: 300, w: 16, h: 408 }, // gap above, y 64..300
      { x: 880, y: 56, w: 16, h: 240 }, // gap 296..520
      { x: 880, y: 520, w: 16, h: 188 },
      { x: 400, y: 560, w: 320, h: 16 },
      { x: 980, y: 380, w: 200, h: 16 },
    ],
    crates: [
      { x: 420, y: 140, w: 44, h: 44 },
      { x: 700, y: 620, w: 44, h: 44 },
      { x: 1180, y: 180, w: 44, h: 44 },
      { x: 140, y: 300, w: 44, h: 44 },
      { x: 1020, y: 620, w: 44, h: 44 },
    ],
    pedestals: [
      { x: 702, y: 162, w: 36, h: 36 },
      { x: 180, y: 100, w: 40, h: 40 },
      { x: 1120, y: 540, w: 40, h: 40 },
    ],
    planters: [
      { x: 160, y: 140, r: 34 },
      { x: 640, y: 140, r: 34 },
      { x: 1120, y: 140, r: 34 },
      { x: 480, y: 660, r: 34 },
      { x: 1120, y: 620, r: 34 },
      { x: 700, y: 420, r: 34 },
    ],
    shadows: [
      { x: 400, y: 300, rx: 90, ry: 60 },
      { x: 900, y: 180, rx: 80, ry: 55 },
      { x: 200, y: 620, rx: 85, ry: 60 },
      { x: 1150, y: 480, rx: 80, ry: 55 },
    ],
    lamps: [
      { x: 720, y: 120, r: 130 },
      { x: 160, y: 460, r: 120 },
      { x: 1120, y: 260, r: 120 },
      { x: 480, y: 620, r: 120 },
    ],
    paintings: [
      { x: 260, y: 64, w: 70, h: 46, color: '#7a4a3a' },
      { x: 580, y: 320, w: 60, h: 80, color: '#3a5a7a' },
      { x: 900, y: 64, w: 70, h: 46, color: '#4a7a3a' },
      { x: 400, y: 580, w: 80, h: 44, color: '#7a6a3a' },
    ],
    guards: [
      { waypoints: [[100, 200], [200, 200], [200, 380], [100, 380]] },
      { waypoints: [[320, 120], [520, 120], [520, 260], [320, 260]] },
      { waypoints: [[620, 360], [840, 360], [840, 480], [620, 480]] },
      { waypoints: [[960, 300], [1200, 300], [1200, 460], [960, 460]] },
      { waypoints: [[300, 620], [520, 620], [520, 660], [300, 660]] },
    ],
    artifact: { x: 720, y: 180 },
    loot: [
      { x: 160, y: 640 },
      { x: 640, y: 640 },
      { x: 1120, y: 300 },
    ],
    exit: { x: 60, y: 76, w: 56, h: 64 },
    spawn: { x: 1200, y: 640 },
  },
  {
    name: 'The Rooftop',
    subtitle: 'Level 3 — moonlight, five sharp-eyed guards, one way out',
    walls: [
      ...borderWalls(),
      { x: 360, y: 56, w: 16, h: 220 }, // gap 276..480
      { x: 360, y: 480, w: 16, h: 228 },
      { x: 760, y: 240, w: 16, h: 468 }, // gap above, y 64..240
      { x: 520, y: 210, w: 16, h: 200 }, // gap above 64..210, below 410..
      { x: 1000, y: 380, w: 16, h: 328 }, // gap above, y 64..380
      { x: 640, y: 560, w: 300, h: 16 },
    ],
    crates: [
      { x: 200, y: 80, w: 44, h: 44 },
      { x: 560, y: 400, w: 44, h: 44 },
      { x: 900, y: 140, w: 44, h: 44 },
      { x: 1180, y: 560, w: 44, h: 44 },
      { x: 460, y: 640, w: 44, h: 44 },
    ],
    pedestals: [
      { x: 622, y: 302, w: 36, h: 36 },
      { x: 240, y: 620, w: 40, h: 40 },
      { x: 1080, y: 420, w: 40, h: 40 },
    ],
    planters: [
      { x: 180, y: 320, r: 34 },
      { x: 640, y: 200, r: 34 },
      { x: 1100, y: 200, r: 34 },
      { x: 480, y: 480, r: 34 },
      { x: 900, y: 640, r: 34 },
    ],
    shadows: [
      { x: 300, y: 600, rx: 90, ry: 60 },
      { x: 800, y: 480, rx: 85, ry: 60 },
      { x: 1150, y: 300, rx: 80, ry: 55 },
      { x: 640, y: 80, rx: 80, ry: 45 },
    ],
    lamps: [
      { x: 640, y: 320, r: 140 },
      { x: 200, y: 460, r: 120 },
      { x: 1120, y: 120, r: 120 },
      { x: 880, y: 620, r: 120 },
    ],
    paintings: [
      { x: 380, y: 64, w: 70, h: 46, color: '#7a4a3a' },
      { x: 780, y: 260, w: 60, h: 80, color: '#3a5a7a' },
      { x: 1020, y: 64, w: 70, h: 46, color: '#4a7a3a' },
      { x: 640, y: 580, w: 80, h: 44, color: '#7a6a3a' },
    ],
    guards: [
      { waypoints: [[140, 160], [300, 160], [300, 260], [140, 260]] },
      { waypoints: [[440, 120], [700, 120], [700, 190], [440, 190]] },
      { waypoints: [[820, 300], [1150, 300], [1150, 340], [820, 340]] },
      { waypoints: [[420, 460], [700, 460], [700, 540], [420, 540]] },
      { waypoints: [[820, 620], [960, 620], [960, 680], [820, 680]] },
    ],
    artifact: { x: 640, y: 320 },
    loot: [
      { x: 1200, y: 640 },
      { x: 180, y: 640 },
      { x: 1080, y: 480 },
    ],
    exit: { x: 1180, y: 76, w: 56, h: 64 },
    spawn: { x: 80, y: 90 },
  },
];

// A fresh deep copy, so one run never mutates the shared definitions.
export function getLevel(index) {
  return JSON.parse(JSON.stringify(LEVELS[index % LEVELS.length]));
}

// Every rectangle that blocks movement and sight.
export function solids(def) {
  return [...def.walls, ...def.crates, ...def.pedestals];
}

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function circleHitsRect(x, y, radius, r) {
  const cx = Math.max(r.x, Math.min(x, r.x + r.w));
  const cy = Math.max(r.y, Math.min(y, r.y + r.h));
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy < radius * radius;
}

// Does a circle of `radius` at (x, y) touch any solid?
export function circleBlocked(def, x, y, radius) {
  for (const r of solids(def)) {
    if (circleHitsRect(x, y, radius, r)) return true;
  }
  return false;
}

// Move a circular body axis by axis, sliding along walls instead of
// stopping dead when a corner catches. Returns true if it moved at all.
export function moveCircle(def, body, dx, dy) {
  let moved = false;
  const nx = body.x + dx;
  if (!circleBlocked(def, nx, body.y, body.radius ?? 14)) {
    body.x = nx;
    moved = true;
  }
  const ny = body.y + dy;
  if (!circleBlocked(def, body.x, ny, body.radius ?? 14)) {
    body.y = ny;
    moved = true;
  }
  body.x = Math.max(12 + (body.radius ?? 14), Math.min(FIELD.W - 12 - (body.radius ?? 14), body.x));
  body.y = Math.max(FIELD.HUD + 8 + (body.radius ?? 14), Math.min(FIELD.H - 12 - (body.radius ?? 14), body.y));
  return moved;
}

// --- line of sight -------------------------------------------------------

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  if (pointInRect(x1, y1, r) || pointInRect(x2, y2, r)) return true;
  const { x, y, w, h } = r;
  return (
    segmentsCross(x1, y1, x2, y2, x, y, x + w, y) ||
    segmentsCross(x1, y1, x2, y2, x + w, y, x + w, y + h) ||
    segmentsCross(x1, y1, x2, y2, x + w, y + h, x, y + h) ||
    segmentsCross(x1, y1, x2, y2, x, y + h, x, y)
  );
}

// True when nothing solid stands between two points.
export function losClear(def, x1, y1, x2, y2) {
  for (const r of solids(def)) {
    if (segmentHitsRect(x1, y1, x2, y2, r)) return false;
  }
  return true;
}

// Is the point inside any planter (a hide spot)?
export function inPlanter(def, x, y) {
  for (const p of def.planters) {
    const dx = x - p.x;
    const dy = y - p.y;
    if (dx * dx + dy * dy <= p.r * p.r) return true;
  }
  return false;
}

// Is the point inside a dark shadow pool (detection fills slower there)?
export function inShadow(def, x, y) {
  for (const s of def.shadows) {
    const dx = (x - s.x) / s.rx;
    const dy = (y - s.y) / s.ry;
    if (dx * dx + dy * dy <= 1) return true;
  }
  return false;
}
