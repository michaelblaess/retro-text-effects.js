import { resolveTarget, getText, setText } from '../core/dom.js';
import { toLines, toCells } from '../core/text.js';
import { randInt, pick } from '../core/random.js';
import { DEFAULT_GLYPHS } from '../core/glyphs.js';
import { createLoop } from '../core/loop.js';

// VHS tape: horizontal glitch bands shift rows sideways and sprinkle noise over
// them, like bad tracking on a worn tape; the glitches calm down until the
// picture stands still.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   fps?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function vhstape(target, options = {}) {
  const element = resolveTarget(target);
  const finalText = getText(element);
  const speed = options.speed || 1;

  const grid = toLines(finalText).map(toCells);
  const height = Math.max(1, grid.length);
  const totalTicks = Math.max(1, Math.round(80 / speed));
  let tick = 0;

  const renderGlitched = (bandCount) => {
    const glitchedRows = new Map();
    for (let b = 0; b < bandCount; b += 1) {
      const startRow = randInt(0, Math.max(0, height - 1));
      const bandHeight = randInt(1, 2);
      const shift = randInt(-6, 6);
      for (let r = startRow; r < Math.min(height, startRow + bandHeight); r += 1) {
        glitchedRows.set(r, shift);
      }
    }

    return grid
      .map((row, r) => {
        if (!glitchedRows.has(r)) {
          return row.join('');
        }
        const shift = glitchedRows.get(r);
        let out = '';
        for (let c = 0; c < row.length; c += 1) {
          const source = row[c - shift];
          const ch = source === undefined ? ' ' : source;
          out += Math.random() < 0.18 ? pick(DEFAULT_GLYPHS) : ch;
        }
        return out;
      })
      .join('\n');
  };

  return createLoop(
    () => {
      tick += 1;

      if (tick >= totalTicks) {
        setText(element, finalText);
        if (options.onDone) {
          options.onDone();
        }
        return false;
      }

      // Zum Ende hin immer weniger Stoerbaender
      const intensity = 1 - tick / totalTicks;
      const bandCount = Math.max(1, Math.round(intensity * 4));
      setText(element, renderGlitched(bandCount));
      return true;
    },
    { fps: options.fps || 30 },
  );
}
