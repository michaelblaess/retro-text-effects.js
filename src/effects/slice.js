import { resolveTarget, getText, setText } from '../core/dom.js';
import { toLines, toCells } from '../core/text.js';
import { createLoop } from '../core/loop.js';
import { easeOutCubic, clamp01 } from '../core/canvas.js';

// Slice: each row is cut in half. The left half sits off to the left, the right
// half off to the right, and the two pieces slide inward until they butt together
// in the middle and form the finished line. Characters that overshoot the block
// edge are clipped, so the width stays fixed the whole time.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   fps?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function slice(target, options = {}) {
  const element = resolveTarget(target);
  const finalText = getText(element);
  const speed = options.speed || 1;

  const grid = toLines(finalText).map(toCells);
  const maxLen = grid.reduce((m, row) => Math.max(m, row.length), 1);

  const perTick = (1 / 45) * speed;
  let progress = 0;

  return createLoop(
    () => {
      progress += perTick;

      if (progress >= 1) {
        setText(element, finalText);
        if (options.onDone) {
          options.onDone();
        }
        return false;
      }

      const e = easeOutCubic(clamp01(progress));
      const shift = Math.round((1 - e) * maxLen);

      const out = grid
        .map((row) => {
          const len = row.length;
          const mid = Math.floor(len / 2);
          let line = '';
          for (let c = 0; c < len; c += 1) {
            // Linke Haelfte kommt von links (Quelle liegt um shift weiter rechts),
            // rechte Haelfte von rechts (Quelle liegt um shift weiter links).
            const fromLeft = c + shift;
            const fromRight = c - shift;
            if (fromLeft < mid && fromLeft >= 0) {
              line += row[fromLeft];
            } else if (fromRight >= mid && fromRight < len) {
              line += row[fromRight];
            } else {
              line += ' ';
            }
          }
          return line;
        })
        .join('\n');
      setText(element, out);
      return true;
    },
    { fps: options.fps || 30 },
  );
}
