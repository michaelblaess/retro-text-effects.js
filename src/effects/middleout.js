import { resolveTarget, getText, setText } from '../core/dom.js';
import { toLines, toCells } from '../core/text.js';
import { createLoop } from '../core/loop.js';

// Middle out: the text grows from the centre of the block outward in all
// directions until everything is revealed.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   fps?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function middleout(target, options = {}) {
  const element = resolveTarget(target);
  const finalText = getText(element);
  const speed = options.speed || 1;

  const grid = toLines(finalText).map(toCells);
  const height = Math.max(1, grid.length);
  const width = grid.reduce((max, row) => Math.max(max, row.length), 1);
  const centerR = (height - 1) / 2;
  const centerC = (width - 1) / 2;

  const totalTicks = Math.max(1, Math.round(40 / speed));
  let tick = 0;

  const render = (front) =>
    grid
      .map((row, r) => {
        let out = '';
        for (let c = 0; c < row.length; c += 1) {
          const dist = Math.max(
            Math.abs(r - centerR) / Math.max(1, height / 2),
            Math.abs(c - centerC) / Math.max(1, width / 2),
          );
          out += dist <= front ? row[c] : ' ';
        }
        return out;
      })
      .join('\n');

  return createLoop(
    () => {
      tick += 1;
      const front = tick / totalTicks;

      if (front >= 1) {
        setText(element, finalText);
        if (options.onDone) {
          options.onDone();
        }
        return false;
      }

      setText(element, render(front));
      return true;
    },
    { fps: options.fps || 30 },
  );
}
