import { animateStage, clamp01 } from '../core/canvas.js';
import { randInt, pick } from '../core/random.js';
import { DEFAULT_GLYPHS } from '../core/glyphs.js';

// Beams (canvas): bright beams sweep along the rows and columns; every character
// a beam passes over stays behind dimly lit. When all beams are through, a wipe
// from the top brings the text up to full brightness.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function beams(target, options = {}) {
  const speed = options.speed || 1;

  return animateStage(target, options, (stage) => {
    // Zeilen und (jede vierte) Spalte bekommen einen Beam
    const rowYs = Array.from(new Set(stage.targets.map((t) => t.y))).sort((a, b) => a - b);
    const colXs = Array.from(new Set(stage.targets.map((t) => t.x)))
      .sort((a, b) => a - b)
      .filter((x, i) => i % 4 === 0);

    const sweeps = [];
    for (const y of rowYs) {
      sweeps.push({
        axis: 'row',
        pos: y,
        dir: Math.random() < 0.5 ? 1 : -1,
        head: 0,
        delay: randInt(0, Math.round(1100 / speed)),
        velocity: (500 + Math.random() * 500) * speed,
        length: stage.width,
      });
    }
    for (const x of colXs) {
      sweeps.push({
        axis: 'col',
        pos: x,
        dir: Math.random() < 0.5 ? 1 : -1,
        head: 0,
        delay: randInt(0, Math.round(1100 / speed)),
        velocity: (400 + Math.random() * 400) * speed,
        length: stage.height,
      });
    }

    const lit = new Set();
    let wipeStart = 0;
    const wipeDuration = 700 / speed;

    return (elapsed, dt) => {
      stage.clear();
      let sweeping = 0;

      for (const sweep of sweeps) {
        if (elapsed < sweep.delay) {
          sweeping += 1;
          continue;
        }
        if (sweep.head < sweep.length + 60) {
          sweep.head += (sweep.velocity * dt) / 1000;
          sweeping += 1;
        }

        const headPos = sweep.dir === 1 ? sweep.head : sweep.length - sweep.head;

        // Zeichen hinter dem Beam als beleuchtet markieren
        for (const t of stage.targets) {
          if (lit.has(t)) {
            continue;
          }
          if (sweep.axis === 'row' && t.y === sweep.pos) {
            if ((sweep.dir === 1 && t.x <= headPos) || (sweep.dir === -1 && t.x >= headPos)) {
              lit.add(t);
            }
          } else if (sweep.axis === 'col' && t.x === sweep.pos) {
            if ((sweep.dir === 1 && t.y <= headPos) || (sweep.dir === -1 && t.y >= headPos)) {
              lit.add(t);
            }
          }
        }

        // Beam-Kopf: ein kurzer, heller Glyphen-Schweif
        if (sweep.head < sweep.length + 60) {
          for (let i = 0; i < 3; i += 1) {
            const offset = i * stage.cellW * sweep.dir;
            stage.ctx.globalAlpha = 1 - i * 0.3;
            if (sweep.axis === 'row') {
              stage.drawChar(pick(DEFAULT_GLYPHS), headPos - offset, sweep.pos, '#ffffff');
            } else {
              stage.drawChar(pick(DEFAULT_GLYPHS), sweep.pos, headPos - i * stage.cellH * sweep.dir, '#ffffff');
            }
            stage.ctx.globalAlpha = 1;
          }
        }
      }

      // Wipe-Phase: von oben nach unten auf volle Helligkeit
      if (sweeping === 0 && wipeStart === 0) {
        wipeStart = elapsed;
      }
      const wipeFront = wipeStart === 0
        ? -1
        : clamp01((elapsed - wipeStart) / wipeDuration) * stage.height;

      for (const t of stage.targets) {
        if (!lit.has(t)) {
          continue;
        }
        if (t.y <= wipeFront) {
          stage.drawChar(t.ch, t.x, t.y);
        } else {
          stage.ctx.globalAlpha = 0.35;
          stage.drawChar(t.ch, t.x, t.y);
          stage.ctx.globalAlpha = 1;
        }
      }

      return sweeping > 0 || wipeStart === 0 || wipeFront < stage.height;
    };
  });
}
