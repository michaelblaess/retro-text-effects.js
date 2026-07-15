import { resolveTarget, getText, setText } from '../core/dom.js';
import { toLines, toCells, isBlank } from '../core/text.js';
import { randInt, pick } from '../core/random.js';
import { MATRIX } from '../core/glyphs.js';
import { createLoop } from '../core/loop.js';

// Matrix: each column resolves top-to-bottom behind a falling bright glyph.
// Cells above the front are locked to their final character, the front cell
// shows a random glyph, cells below are still empty. Colour is inherited from
// the host element (our terminals are already green on black).

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   glyphs?: string,
 *   fps?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function matrix(target, options = {}) {
  const element = resolveTarget(target);
  const finalText = getText(element);
  const glyphs = options.glyphs ? Array.from(options.glyphs) : MATRIX;
  const speed = options.speed || 1;

  const grid = toLines(finalText).map(toCells);
  const height = grid.length;
  const width = grid.reduce((max, row) => Math.max(max, row.length), 0);

  const columns = [];
  for (let c = 0; c < width; c += 1) {
    columns.push({
      front: 0,
      delay: randInt(0, Math.round(height / speed) + 4),
      step: randInt(1, 2),
    });
  }

  const render = () =>
    grid
      .map((row, r) => {
        let out = '';
        for (let c = 0; c < row.length; c += 1) {
          const ch = row[c];
          if (isBlank(ch)) {
            out += ch;
            continue;
          }
          const reach = columns[c].front - columns[c].delay;
          if (r < reach - 1) {
            out += ch;
          } else if (r <= reach) {
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
      let done = true;
      for (const column of columns) {
        column.front += column.step;
        if (column.front - column.delay < height + 1) {
          done = false;
        }
      }

      if (done) {
        setText(element, finalText);
        if (options.onDone) {
          options.onDone();
        }
        return false;
      }

      setText(element, render());
      return true;
    },
    { fps: options.fps || 30 },
  );
}
