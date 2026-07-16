import { resolveTarget, getText, setText } from '../core/dom.js';
import { toLines, toCells, isBlank } from '../core/text.js';
import { createLoop } from '../core/loop.js';

// Random sequence: the characters appear one after another in completely random
// order until the text is complete.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   fps?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function randomsequence(target, options = {}) {
  const element = resolveTarget(target);
  const finalText = getText(element);
  const speed = options.speed || 1;

  const grid = toLines(finalText).map(toCells);
  const order = [];
  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid[r].length; c += 1) {
      if (!isBlank(grid[r][c])) {
        order.push({ r, c });
      }
    }
  }
  order.sort(() => Math.random() - 0.5);

  const work = grid.map((row) => row.map((ch) => (isBlank(ch) ? ch : ' ')));
  const perTick = Math.max(1, Math.round((order.length / 75) * speed));
  let revealed = 0;

  return createLoop(
    () => {
      for (let i = 0; i < perTick && revealed < order.length; i += 1) {
        const cell = order[revealed];
        work[cell.r][cell.c] = grid[cell.r][cell.c];
        revealed += 1;
      }

      if (revealed >= order.length) {
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
