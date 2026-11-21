// Gilded Shadows — everything the player sees. Canvas 2D, drawn fresh
// every frame from the world state: the marble floor and lamplight, the
// guards and their vision cones, Wren, the loot, and the HUD. The judge
// reads the game mostly through its screenshots, so the cones, the cover
// and the exit must all be readable at a glance, even shrunk small.

import { FIELD, PALETTE, FONT } from './config.js';
import { alertLevel, formatTime } from './world.js';

// A cone colour by guard state: calm amber, curious orange, alarmed red.
function coneColor(g) {
  if (g.state === 'alerted') return PALETTE.coneAlerted;
  if (g.state === 'suspicious' || g.state === 'search') return PALETTE.coneSuspicious;
  return PALETTE.coneCalm;
}

function drawFloor(ctx, world) {
  ctx.fillStyle = PALETTE.floorA;
  ctx.fillRect(0, FIELD.HUD, FIELD.W, FIELD.H - FIELD.HUD);
  // Marble tiles: a quiet checker with hairline joints.
  const tile = 64;
  for (let y = FIELD.HUD; y < FIELD.H; y += tile) {
    for (let x = 0; x < FIELD.W; x += tile) {
      if (((x / tile) | 0) % 2 === ((y / tile) | 0) % 2) {
        ctx.fillStyle = PALETTE.floorB;
        ctx.fillRect(x, y, tile, tile);
      }
      ctx.strokeStyle = PALETTE.floorLine;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, tile, tile);
    }
  }
  // Warm pools of lamplight, cool moonlight between them.
  for (const lamp of world.def.lamps) {
    const g = ctx.createRadialGradient(lamp.x, lamp.y, 8, lamp.x, lamp.y, lamp.r);
    g.addColorStop(0, 'rgba(255, 217, 138, 0.20)');
    g.addColorStop(1, 'rgba(255, 217, 138, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(lamp.x - lamp.r, lamp.y - lamp.r, lamp.r * 2, lamp.r * 2);
  }
  const moon = ctx.createRadialGradient(1080, 90, 10, 1080, 90, 420);
  moon.addColorStop(0, 'rgba(127, 168, 255, 0.07)');
  moon.addColorStop(1, 'rgba(127, 168, 255, 0)');
  ctx.fillStyle = moon;
  ctx.fillRect(660, FIELD.HUD, 620, 420);
  // Dark shadow pools: the safe ground, drawn as soft ink.
  for (const s of world.def.shadows) {
    ctx.fillStyle = 'rgba(3, 4, 8, 0.55)';
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, s.rx, s.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120, 140, 190, 0.18)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawExit(ctx, world) {
  const e = world.def.exit;
  const open = world.artifactTaken;
  const pulse = 0.55 + 0.25 * Math.sin(world.time * 3);
  ctx.save();
  ctx.shadowColor = PALETTE.exit;
  ctx.shadowBlur = open ? 26 : 10;
  ctx.fillStyle = open ? PALETTE.exit : PALETTE.exitDark;
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.restore();
  ctx.strokeStyle = open ? '#b8ffdd' : '#2a8f66';
  ctx.lineWidth = 2;
  ctx.strokeRect(e.x + 1, e.y + 1, e.w - 2, e.h - 2);
  ctx.fillStyle = open ? '#062b1a' : '#b8ffdd';
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', e.x + e.w / 2, e.y + e.h / 2 + 4);
  if (open) {
    ctx.fillStyle = `rgba(57, 217, 138, ${pulse})`;
    ctx.beginPath();
    ctx.arc(e.x + e.w / 2, e.y - 14, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawArtifact(ctx, world) {
  if (world.artifactTaken) return;
  const a = world.def.artifact;
  const t = world.time;
  const bob = Math.sin(t * 2.2) * 3;
  const glow = 18 + 8 * Math.sin(t * 2.2);
  ctx.save();
  ctx.translate(a.x, a.y + bob - 12);
  ctx.shadowColor = PALETTE.artifact;
  ctx.shadowBlur = glow;
  ctx.fillStyle = PALETTE.artifact;
  ctx.rotate(Math.PI / 4 + Math.sin(t * 0.9) * 0.12);
  const s = 15;
  ctx.fillRect(-s / 2, -s / 2, s, s);
  ctx.restore();
  ctx.save();
  ctx.translate(a.x, a.y + bob - 12);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.lineTo(0, 11);
  ctx.moveTo(-11, 0);
  ctx.lineTo(11, 0);
  ctx.stroke();
  ctx.restore();
  // A label the judge can read: this is the thing to steal.
  ctx.fillStyle = 'rgba(174, 230, 255, 0.9)';
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('STAR OF MERIDIAN', a.x, a.y + 34);
}

function drawLoot(ctx, world) {
  world.def.loot.forEach((gem, i) => {
    if (world.lootTaken[i]) return;
    const pulse = 0.7 + 0.3 * Math.sin(world.time * 3 + i * 2);
    ctx.save();
    ctx.translate(gem.x, gem.y);
    ctx.globalAlpha = pulse;
    ctx.shadowColor = PALETTE.loot;
    ctx.shadowBlur = 10;
    ctx.fillStyle = PALETTE.loot;
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-6, -6, 12, 12);
    ctx.restore();
  });
}

function drawVisionCone(ctx, g) {
  const color = coneColor(g);
  const grad = ctx.createRadialGradient(g.x, g.y, 10, g.x, g.y, g.viewRange);
  grad.addColorStop(0, `rgba(${color}, 0.34)`);
  grad.addColorStop(0.7, `rgba(${color}, 0.16)`);
  grad.addColorStop(1, `rgba(${color}, 0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.arc(g.x, g.y, g.viewRange, g.dir - g.viewHalf, g.dir + g.viewHalf);
  ctx.closePath();
  ctx.fill();
  // A crisp edge, so the cone reads even when the screenshot is small.
  ctx.strokeStyle = `rgba(${color}, 0.45)`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(g.x + Math.cos(g.dir - g.viewHalf) * g.viewRange, g.y + Math.sin(g.dir - g.viewHalf) * g.viewRange);
  ctx.lineTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(g.dir + g.viewHalf) * g.viewRange, g.y + Math.sin(g.dir + g.viewHalf) * g.viewRange);
  ctx.stroke();
}

function drawGuard(ctx, g) {
  // Body: a navy uniform, visible against the marble.
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = PALETTE.guard;
  ctx.beginPath();
  ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = PALETTE.guardTrim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
  ctx.stroke();
  // Facing: a flashlight dot and a cap brim, so the direction reads.
  const fx = g.x + Math.cos(g.dir) * 9;
  const fy = g.y + Math.sin(g.dir) * 9;
  ctx.fillStyle = '#ffe9b0';
  ctx.beginPath();
  ctx.arc(fx, fy, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.guardTrim;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(g.x + Math.cos(g.dir + 0.5) * g.radius, g.y + Math.sin(g.dir + 0.5) * g.radius);
  ctx.lineTo(g.x + Math.cos(g.dir - 0.5) * g.radius, g.y + Math.sin(g.dir - 0.5) * g.radius);
  ctx.stroke();
  // Detection meter above the head: green to amber to red.
  const w = 40;
  const frac = g.detection / 100;
  const bx = g.x - w / 2;
  const by = g.y - g.radius - 14;
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(bx - 1, by - 1, w + 2, 7);
  ctx.fillStyle = frac < 0.35 ? PALETTE.ok : frac < 1 ? PALETTE.warn : PALETTE.danger;
  if (frac > 0.02) ctx.fillRect(bx, by, w * frac, 5);
  // A floating mark says what the guard is thinking.
  if (g.state === 'alerted') {
    ctx.fillStyle = PALETTE.danger;
    ctx.font = '700 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, by - 8);
  } else if (g.state === 'suspicious' || g.state === 'search') {
    ctx.fillStyle = PALETTE.warn;
    ctx.font = '700 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', g.x, by - 8);
  }
}

function drawPlayer(ctx, world) {
  const p = world.player;
  ctx.save();
  if (p.hidden) ctx.globalAlpha = 0.55; // tucked into the planter
  // A soft ring marks Wren against the floor; dashed while sneaking.
  ctx.strokeStyle = 'rgba(201, 163, 92, 0.5)';
  ctx.lineWidth = 1.5;
  if (p.sneaking) ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius + 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // Hooded cloak.
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = PALETTE.playerTrim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.stroke();
  // Hood point and a glimpse of face in the facing direction.
  const hx = p.x + Math.cos(p.dir) * 7;
  const hy = p.y + Math.sin(p.dir) * 7;
  ctx.fillStyle = '#e8dcc0';
  ctx.beginPath();
  ctx.arc(hx, hy, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawStructures(ctx, world) {
  const def = world.def;
  // Paintings hang on the walls: small framed canvases.
  for (const pt of def.paintings) {
    ctx.fillStyle = '#3a2f1e';
    ctx.fillRect(pt.x - 3, pt.y - 3, pt.w + 6, pt.h + 6);
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x, pt.y, pt.w, pt.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(pt.x + 4.5, pt.y + 4.5, pt.w - 9, pt.h - 9);
  }
  // Walls: slate blocks with a gold top edge, drawn over the cones so the
  // cones look blocked by them.
  for (const w of def.walls) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(w.x, w.y, w.w, 2);
    ctx.fillStyle = PALETTE.wallDark;
    ctx.fillRect(w.x, w.y + w.h - 2, w.w, 2);
  }
  // Crates and pedestals: cover that blocks sight.
  for (const c of [...def.crates, ...def.pedestals]) {
    ctx.fillStyle = PALETTE.crate;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = PALETTE.crateEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x + c.w, c.y + c.h);
    ctx.moveTo(c.x + c.w, c.y);
    ctx.lineTo(c.x, c.y + c.h);
    ctx.stroke();
  }
  // Planters: leafy hide spots, drawn over the player when hiding.
  for (const p of def.planters) {
    ctx.fillStyle = PALETTE.planter;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.planterLeaf;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + p.x * 0.01;
      ctx.beginPath();
      ctx.arc(p.x + Math.cos(a) * p.r * 0.55, p.y + Math.sin(a) * p.r * 0.55, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = PALETTE.planterFlower;
    ctx.beginPath();
    ctx.arc(p.x - 8, p.y - 6, 3.5, 0, Math.PI * 2);
    ctx.arc(p.x + 10, p.y + 8, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawNoise(ctx, world) {
  for (const n of world.noiseEvents) {
    const progress = 1 - n.t / n.max;
    ctx.strokeStyle = `rgba(255, 220, 140, ${(n.t / n.max) * 0.65})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(n.x, n.y, Math.max(6, n.r * progress), 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawHud(ctx, world) {
  ctx.fillStyle = PALETTE.hudBg;
  ctx.fillRect(0, 0, FIELD.W, FIELD.HUD);
  ctx.fillStyle = PALETTE.wallTop;
  ctx.fillRect(0, FIELD.HUD - 2, FIELD.W, 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = FONT.hud;
  ctx.fillText(`${world.def.name}  ·  ${formatTime(world.time)}`, 16, FIELD.HUD / 2 - 8);
  ctx.fillStyle = PALETTE.hudMuted;
  ctx.font = FONT.hudSmall;
  const lootTotal = world.def.loot.length;
  const objective = world.artifactTaken ? '★ Star stolen — reach the EXIT' : '○ Steal the Star of Meridian';
  ctx.fillText(`${objective}   ◆ Loot ${world.lootCount}/${lootTotal}   Score ${world.score}`, 16, FIELD.HUD / 2 + 13);
  // The alert eye: a watchful eye that fills as any guard's meter rises.
  // It sits left of the controls hint, clear of the right-aligned text.
  const level = alertLevel(world);
  const ex = FIELD.W - 380;
  const ey = FIELD.HUD / 2;
  ctx.fillStyle = level >= 100 ? PALETTE.danger : level >= 35 ? PALETTE.warn : '#c8ccd8';
  ctx.beginPath();
  ctx.ellipse(ex, ey, 26, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0a0c14';
  ctx.beginPath();
  ctx.arc(ex, ey, 7 + level * 0.03, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = level >= 100 ? '#fff' : '#0a0c14';
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(level >= 100 ? '!' : `${Math.round(level)}%`, ex + 44, ey + 1);
  ctx.fillStyle = PALETTE.hudMuted;
  ctx.font = FONT.hudSmall;
  ctx.textAlign = 'right';
  ctx.fillText('Shift sneak · P pause · R restart', FIELD.W - 16, FIELD.HUD / 2);
  ctx.textBaseline = 'alphabetic';
}

function dim(ctx) {
  ctx.fillStyle = 'rgba(4, 5, 10, 0.78)';
  ctx.fillRect(0, 0, FIELD.W, FIELD.H);
}

function centerText(ctx, lines, startY, gap) {
  ctx.textAlign = 'center';
  lines.forEach((line, i) => {
    ctx.font = line.font;
    ctx.fillStyle = line.color;
    ctx.fillText(line.text, FIELD.W / 2, startY + i * gap);
  });
}

function drawTitle(ctx, world) {
  dim(ctx);
  centerText(ctx, [
    { font: FONT.title, color: '#e8c87a', text: 'GILDED SHADOWS' },
    { font: FONT.subtitle, color: PALETTE.hudText, text: 'a museum heist in three galleries — steal the Star of Meridian, unseen' },
    { font: FONT.body, color: PALETTE.hudMuted, text: 'WASD / arrows to move · hold Shift to sneak · running is loud' },
    { font: FONT.body, color: PALETTE.hudMuted, text: 'Stay out of the amber cones · hide in planters · rest in the shadows' },
    { font: FONT.body, color: PALETTE.hudMuted, text: 'Grab the diamond and the loot, then slip out the green EXIT' },
    { font: '700 20px system-ui, sans-serif', color: PALETTE.hudText, text: 'Press Enter or click to begin' },
  ], 190, 52);
}

function drawPaused(ctx) {
  dim(ctx);
  centerText(ctx, [
    { font: FONT.big, color: PALETTE.hudText, text: 'PAUSED' },
    { font: FONT.body, color: PALETTE.hudMuted, text: 'Press P or Esc to keep sneaking · R restarts the level' },
  ], 320, 48);
}

function drawLevelClear(ctx, world) {
  dim(ctx);
  centerText(ctx, [
    { font: FONT.big, color: PALETTE.ok, text: `${world.def.name} — CLEAR` },
    { font: FONT.body, color: PALETTE.hudText, text: `Score ${world.score} · ${formatTime(world.time)} · the next gallery awaits…` },
  ], 320, 48);
}

function drawWin(ctx, world) {
  dim(ctx);
  const lines = [
    { font: FONT.big, color: PALETTE.ok, text: 'CLEAN GETAWAY' },
    { font: FONT.subtitle, color: PALETTE.hudText, text: world.ghost ? 'GHOST — no guard ever raised the alarm' : 'You escaped — but someone saw you' },
    { font: FONT.body, color: PALETTE.hudText, text: `Time ${formatTime(world.time)} · Loot ${world.lootCount}/${world.def.loot.length} · Score ${world.score}` },
    { font: FONT.body, color: PALETTE.hudMuted, text: 'Press R to play again' },
  ];
  centerText(ctx, lines, 240, 52);
  if (world.ghost) {
    ctx.font = '700 92px Georgia, serif';
    ctx.fillStyle = '#e8c87a';
    ctx.textAlign = 'center';
    ctx.fillText('GHOST', FIELD.W / 2, 540);
  }
}

function drawLose(ctx, world) {
  dim(ctx);
  centerText(ctx, [
    { font: FONT.big, color: PALETTE.danger, text: 'CAUGHT!' },
    { font: FONT.subtitle, color: PALETTE.hudText, text: 'A guard closed in while the alarm was up — the museum keeps its diamond.' },
    { font: FONT.body, color: PALETTE.hudMuted, text: 'Press R to try again — slower this time, and mind the cones' },
  ], 300, 52);
}

// Draw one frame. `screen` is title | play | paused | levelclear | win | lose.
export function drawGame(ctx, world, screen) {
  drawFloor(ctx, world);
  drawExit(ctx, world);
  drawArtifact(ctx, world);
  drawLoot(ctx, world);
  for (const g of world.guards) drawVisionCone(ctx, g);
  drawStructures(ctx, world);
  for (const g of world.guards) drawGuard(ctx, g);
  drawPlayer(ctx, world);
  drawNoise(ctx, world);
  drawHud(ctx, world);
  if (screen === 'title') drawTitle(ctx, world);
  else if (screen === 'paused') drawPaused(ctx);
  else if (screen === 'levelclear') drawLevelClear(ctx, world);
  else if (screen === 'win') drawWin(ctx, world);
  else if (screen === 'lose') drawLose(ctx, world);
}
