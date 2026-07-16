import { resolveTarget, getText, setText } from '../core/dom.js';
import { toLines, toCells } from '../core/text.js';
import { randInt } from '../core/random.js';
import { createLoop } from '../core/loop.js';

// Slide: the rows slide into place as blocks - odd rows from the left, even rows
// from the right, each with a small stagger.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   fps?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function slide(target, options = {}) {
  const element = resolveTarget(target);
  const finalText = getText(element);
  const speed = options.speed || 1;

  const grid = toLines(finalText).map(toCells);
  const width = grid.reduce((max, row) => Math.max(max, row.length), 1);

  const step = Math.max(1, Math.round((width / 30) * speed));
  const rows = grid.map((cells, r) => ({
    cells,
    fromLeft: r % 2 === 0,
    offset: width + randInt(0, Math.round(width / 3)),
  }));

  const renderRow = (row) => {
    if (row.offset <= 0) {
      return row.cells.join('');
    }
    if (row.fromLeft) {
      // Block kommt von links: nur das Ende der Zeile ist schon sichtbar
      const visible = Math.max(0, row.cells.length - row.offset);
      return row.cells.slice(row.cells.length - visible).join('');
    }
    // Block kommt von rechts: Anfang der Zeile steht weiter rechts, Ende ist abgeschnitten
    const pad = Math.min(row.offset, width);
    return ' '.repeat(pad) + row.cells.join('').slice(0, Math.max(0, width - pad));
  };

  return createLoop(
    () => {
      let moving = 0;
      for (const row of rows) {
        if (row.offset > 0) {
          row.offset = Math.max(0, row.offset - step);
          if (row.offset > 0) {
            moving += 1;
          }
        }
      }

      if (moving === 0) {
        setText(element, finalText);
        if (options.onDone) {
          options.onDone();
        }
        return false;
      }

      setText(element, rows.map(renderRow).join('\n'));
      return true;
    },
    { fps: options.fps || 30 },
  );
}
