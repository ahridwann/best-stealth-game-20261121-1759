// Gilded Shadows — the program that hands the game in.
//
// It copies this repository's game/ and screenshots/ into the output
// directory and writes output/dossier.json, the summary the judge reads,
// using the vendored make.fun library. Node 22, standard library only:
// nothing is installed before it runs, and there is no network.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for
// /output, so a local check looks like this:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Run it twice and the two outputs must be byte-identical.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(from, to) {
  if (!existsSync(from)) return;
  cpSync(from, to, { recursive: true });
}

function handIn() {
  // Fail fast with a clear error instead of handing in a broken entry:
  // without game/index.html the gate would refuse the dossier anyway.
  if (!existsSync(join(repoRoot, 'game', 'index.html'))) {
    throw new Error('hand-in refused: game/index.html is missing from the repository');
  }
  if (!existsSync(join(repoRoot, 'screenshots'))) {
    throw new Error('hand-in refused: screenshots/ is missing from the repository');
  }

  // Start from an empty output directory so a stale file from an earlier
  // run can never leak into this entry.
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });

  copyTree(join(repoRoot, 'game'), join(outputDir, 'game'));
  copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));

  // The scorer's own caps, from the kit's reference/gate.json: the text
  // cap shapes the dossier's bytes, the rest refuse an entry the scorer
  // would refuse (more than 4 screenshots or one over 256 KiB, more than
  // 993 files in game/ or 48 MiB of game files in all, or a path under
  // game/ over 1000 bytes). game/ counts beside /output's own cap of
  // 1000 entries, which it shares with screenshots/ and dossier.json.
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  });
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
}

handIn();
