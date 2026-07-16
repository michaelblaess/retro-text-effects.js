import { resolveTarget, getText, setText } from '../core/dom.js';
import { toLines, toCells, isBlank } from '../core/text.js';
import { pick } from '../core/random.js';
import { DEFAULT_GLYPHS } from '../core/glyphs.js';
import { createLoop } from '../core/loop.js';

// Sweep: a noisy band moves left to right across the block; behind the band the
// final text stands, inside the band the cells flicker.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   glyphs?: string,
 *   band?: number,
 *   fps?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function sweep(target, options = {}) {
  const element = resolveTarget(target);
  const finalText = getText(element);
  const speed = options.speed || 1;
  const glyphs = options.glyphs ? Array.from(options.glyphs) : DEFAULT_GLYPHS;
  const band = options.band || 6;

  const grid = toLines(finalText).map(toCells);
  const width = grid.reduce((max, row) => Math.max(max, row.length), 1);

  const totalTicks = Math.max(1, Math.round(50 / speed));
  let tick = 0;

  const render = (front) =>
    grid
      .map((row) => {
        let out = '';
        for (let c = 0; c < row.length; c += 1) {
          if (isBlank(row[c])) {
            out += row[c];
          } else if (c < front - band) {
            out += row[c];
          } else if (c < front) {
            out += pick(glyphs);
          } else {
            out += ' ';
          }
        }
        return out;
      })
      .join('\n');

  return createLoop(
    () => {
      tick += 1;
      const front = ((width + band) * tick) / totalTicks;

      if (front >= width + band) {
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
