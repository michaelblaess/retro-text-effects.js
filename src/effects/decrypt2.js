import { animateStage } from '../core/canvas.js';
import { randInt, pick } from '../core/random.js';
import { DEFAULT_GLYPHS } from '../core/glyphs.js';

// Decrypt 2 (canvas): the canvas twin of decrypt - every cell flickers through
// random glyphs and locks onto its final character. On the canvas the unresolved
// ciphertext is drawn dimmed, so the resolved text visibly emerges from the noise.

const TICK_MS = 33;

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   glyphs?: string,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function decrypt2(target, options = {}) {
  const speed = options.speed || 1;
  const glyphs = options.glyphs ? Array.from(options.glyphs) : DEFAULT_GLYPHS;

  return animateStage(target, options, (stage) => {
    const cells = stage.targets.map((t) => ({
      t,
      flips: Math.max(1, Math.round(randInt(6, 34) / speed)),
      current: pick(glyphs),
    }));
    let doneTicks = 0;

    return (elapsed) => {
      const ticks = Math.floor(elapsed / TICK_MS);
      while (doneTicks < ticks) {
        doneTicks += 1;
        for (const cell of cells) {
          if (cell.flips > 0) {
            cell.flips -= 1;
            cell.current = cell.flips === 0 ? cell.t.ch : pick(glyphs);
          }
        }
      }

      stage.clear();
      let unresolved = 0;
      for (const cell of cells) {
        if (cell.flips > 0) {
          unresolved += 1;
          stage.ctx.globalAlpha = 0.55;
          stage.drawChar(cell.current, cell.t.x, cell.t.y);
          stage.ctx.globalAlpha = 1;
        } else {
          stage.drawChar(cell.t.ch, cell.t.x, cell.t.y);
        }
      }

      return unresolved > 0;
    };
  });
}
