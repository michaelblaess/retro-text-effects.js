import { resolveTarget, getText, setText } from '../core/dom.js';
import { toLines, toCells, isBlank } from '../core/text.js';
import { createLoop } from '../core/loop.js';

// Waves: an undulating crest rolls across the block from left to right. Ahead of
// the crest the cells are still blank, the crest itself shows as a shaded band and
// behind it the resolved text stays. The front is bent by a sine per row, so the
// wave ripples up and down as it travels instead of running dead straight.

const CREST = Array.from('▓▒░');

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   amplitude?: number,
 *   fps?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function waves(target, options = {}) {
  const element = resolveTarget(target);
  const finalText = getText(element);
  const speed = options.speed || 1;
  const amplitude = options.amplitude === undefined ? 4 : options.amplitude;

  const grid = toLines(finalText).map(toCells);
  const maxLen = grid.reduce((m, row) => Math.max(m, row.length), 1);

  const perTick = Math.max(1, (maxLen + amplitude + CREST.length) / 42) * speed;
  let front = -amplitude;

  return createLoop(
    () => {
      front += perTick;

      if (front >= maxLen + amplitude + CREST.length) {
        setText(element, finalText);
        if (options.onDone) {
          options.onDone();
        }
        return false;
      }

      const out = grid
        .map((row, r) => {
          // Wellenfront pro Zeile per Sinus verschieben (die Ripple-Bewegung).
          const rowFront = front + Math.sin(r * 0.6) * amplitude;
          let line = '';
          for (let c = 0; c < row.length; c += 1) {
            const ch = row[c];
            if (isBlank(ch)) {
              line += ch;
              continue;
            }
            const d = rowFront - c;
            if (d < 0) {
              line += ' ';
            } else if (d < CREST.length) {
              line += CREST[Math.floor(d)];
            } else {
              line += ch;
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
