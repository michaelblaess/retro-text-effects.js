import { resolveTarget, getText, setText } from '../core/dom.js';
import { toLines, toCells, isBlank } from '../core/text.js';
import { createLoop } from '../core/loop.js';

// Pour: the text fills up from the bottom row like a liquid, row by row in a
// snaking back-and-forth order.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   fps?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function pour(target, options = {}) {
  const element = resolveTarget(target);
  const finalText = getText(element);
  const speed = options.speed || 1;

  const grid = toLines(finalText).map(toCells);

  // Fuellreihenfolge: unterste Zeile zuerst, abwechselnd links/rechts (Schlangenlinie)
  const order = [];
  for (let r = grid.length - 1; r >= 0; r -= 1) {
    const row = grid[r];
    const leftToRight = (grid.length - 1 - r) % 2 === 0;
    for (let i = 0; i < row.length; i += 1) {
      const c = leftToRight ? i : row.length - 1 - i;
      if (!isBlank(row[c])) {
        order.push({ r, c });
      }
    }
  }

  const work = grid.map((row) => row.map((ch) => (isBlank(ch) ? ch : ' ')));
  const perTick = Math.max(1, Math.round((order.length / 70) * speed));
  let filled = 0;

  return createLoop(
    () => {
      for (let i = 0; i < perTick && filled < order.length; i += 1) {
        const cell = order[filled];
        work[cell.r][cell.c] = grid[cell.r][cell.c];
        filled += 1;
      }

      if (filled >= order.length) {
        setText(element, finalText);
        if (options.onDone) {
          options.onDone();
        }
        return false;
      }

      setText(element, work.map((row) => row.join('')).join('\n'));
      return true;
    },
    { fps: options.fps || 30 },
  );
}
