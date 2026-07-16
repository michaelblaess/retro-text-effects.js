import { animateStage, easeOutCubic, clamp01 } from '../core/canvas.js';

// Overflow 2 (canvas): the canvas twin of overflow - the whole block spins past
// like a scroll buffer that overflowed, decelerates smoothly (sub-pixel, which
// plain text cannot do) and settles on the final text.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   cycles?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function overflow2(target, options = {}) {
  const speed = options.speed || 1;
  const cycles = options.cycles || 3;

  return animateStage(target, options, (stage) => {
    // Zeilen aus den Zielzellen rekonstruieren (gleiche y-Koordinate = gleiche Zeile)
    const rowMap = new Map();
    for (const t of stage.targets) {
      if (!rowMap.has(t.y)) {
        rowMap.set(t.y, []);
      }
      rowMap.get(t.y).push(t);
    }
    const rows = Array.from(rowMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map((entry) => ({ y: entry[0], cells: entry[1] }));

    const blockHeight = Math.max(stage.cellH, rows.length * stage.cellH);
    const totalScroll = cycles * blockHeight;
    const duration = 1800 / speed;

    return (elapsed) => {
      stage.clear();
      const progress = clamp01(elapsed / duration);
      const scroll = (1 - easeOutCubic(progress)) * totalScroll;

      for (const row of rows) {
        // Verschobene Position mit Wrap-around innerhalb des Blocks
        let y = row.y + scroll;
        const top = rows[0].y;
        y = top + (((y - top) % blockHeight) + blockHeight) % blockHeight;
        for (const cell of row.cells) {
          stage.drawChar(cell.ch, cell.x, y);
        }
      }

      return progress < 1;
    };
  });
}
