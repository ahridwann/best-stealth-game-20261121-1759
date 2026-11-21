// Gilded Shadows — every tuning number and colour in one place, so the
// feel of the game can be balanced without touching the rules or the art.

export const FIELD = { W: 1280, H: 720, HUD: 56 };

// The player is Wren, a cat burglar. Running is quick and loud, sneaking is
// slow and quiet; walking sits between the two.
export const PLAYER = {
  RADIUS: 14,
  WALK: 178,
  SNEAK: 88,
  RUN: 268,
  NOISE_EVERY: 0.45, // seconds between noise rings while running
  NOISE_RADIUS: 235, // how far away a guard can hear a running step
  PICKUP_RADIUS: 34, // artifact grab distance
  LOOT_RADIUS: 28,
};

// One guard's senses. viewRange is how far the cone reaches, viewHalfAngle
// is half its spread. detectRate is the base fill speed of the detection
// meter (per second) when the player stands still in the middle of the cone.
export const GUARD = {
  RADIUS: 15,
  PATROL_SPEED: 78,
  SUSPICIOUS_SPEED: 112,
  CHASE_SPEED: 168,
  RETURN_SPEED: 96,
  VIEW_RANGE: 225,
  VIEW_HALF_ANGLE: 0.62, // ~35.5 degrees each side
  DETECT_RATE: 55,
  DETECT_DECAY: 26, // per second while the player is unseen
  SUSPICIOUS_AT: 35, // meter value where a guard stops to look
  ALERTED_AT: 100,
  CALM_BELOW: 18, // meter value where a searching guard gives up
  CATCH_RADIUS: 27, // an alerted guard this close catches Wren
  LOSE_SIGHT_AFTER: 2.5, // seconds unseen before an alerted guard searches
  SEARCH_TIME: 5.0,
  HIDE_CLOSE: 55, // a guard this close sees through a planter
  WAYPOINT_PAUSE: 0.7,
};

// Per-level overrides: later levels patrol faster, see further and fill
// the detection meter quicker.
export const LEVEL_TUNING = [
  { patrolSpeed: 78, chaseSpeed: 168, viewRange: 225, detectRate: 55, guardCount: 4 },
  { patrolSpeed: 88, chaseSpeed: 178, viewRange: 242, detectRate: 63, guardCount: 5 },
  { patrolSpeed: 99, chaseSpeed: 190, viewRange: 262, detectRate: 72, guardCount: 5 },
];

export const SCORE = { ARTIFACT: 500, LOOT: 100, GHOST_BONUS: 400, LEVEL_CLEAR: 150 };

export const PALETTE = {
  floorA: '#171a26',
  floorB: '#141724',
  floorLine: '#1e2233',
  wall: '#2b3049',
  wallTop: '#c9a35c',
  wallDark: '#1c2033',
  crate: '#6b4a2b',
  crateEdge: '#8a6238',
  planter: '#1f4d2e',
  planterLeaf: '#2f7a44',
  planterFlower: '#d96a8b',
  shadow: '#05060a',
  lampGlow: '#ffd98a',
  moonGlow: '#7fa8ff',
  coneCalm: '255, 190, 80',
  coneSuspicious: '255, 140, 60',
  coneAlerted: '255, 60, 50',
  guard: '#2e4a7a',
  guardTrim: '#9db8e8',
  player: '#241d33',
  playerTrim: '#c9a35c',
  artifact: '#aee6ff',
  loot: '#ffd76a',
  exit: '#39d98a',
  exitDark: '#0d5c34',
  hudBg: '#0a0c14',
  hudText: '#e8e4d8',
  hudMuted: '#8b93a7',
  danger: '#ff4d42',
  warn: '#ffb03a',
  ok: '#39d98a',
};

export const FONT = {
  title: '700 64px Georgia, serif',
  subtitle: '20px Georgia, serif',
  hud: '600 15px system-ui, sans-serif',
  hudSmall: '13px system-ui, sans-serif',
  big: '700 40px Georgia, serif',
  body: '16px system-ui, sans-serif',
};
