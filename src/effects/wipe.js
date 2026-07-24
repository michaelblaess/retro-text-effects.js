import { resolveTarget, getText, setText } from '../core/dom.js';
import { toLines, toCells, isBlank } from '../core/text.js';
import { createLoop } from '../core/loop.js';

// Wipe: a straight wavefront sweeps across the block in a chosen direction and
// leaves the resolved text behind it. Cells the front has not reached yet render
// as spaces so the final width (and any box frame) stays intact while it fills in.

// Liefert den "Rang" einer Zelle entlang der Wischrichtung. Der Wavefront waechst
// von 0 bis maxRank; eine Zelle ist sichtbar, sobald ihr Rang <= Wavefront ist.
function rankFor(direction, r, c, maxR, maxC) {
  switch (direction) {
    case 'right':
      return maxC - c;
    case 'up':
      return maxR - r;
    case 'down':
      return r;
    case 'left':
      return c;
    case 'diagonal':
    default:
      return r + c;
  }
}

/**
 * @param {Element|string} target
 * @param {{
 *   direction?: 'left'|'right'|'up'|'down'|'diagonal',
 *   speed?: number,
 *   fps?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function wipe(target, options = {}) {
  const element = resolveTarget(target);
  const finalText = getText(element);
  const speed = options.speed || 1;
  const direction = options.direction || 'diagonal';

  const grid = toLines(finalText).map(toCells);
  const maxR = grid.length - 1;
  const maxC = grid.reduce((m, row) => Math.max(m, row.length), 1) - 1;

  // Rang je Zelle vorberechnen und den groessten Rang als Ziel des Wavefronts merken.
  let maxRank = 0;
  const ranks = grid.map((row, r) => row.map((ch, c) => {
    const rank = rankFor(direction, r, c, maxR, maxC);
    if (rank > maxRank) {
      maxRank = rank;
    }
    return rank;
  }));

  const perTick = Math.max(1, (maxRank + 2) / 45) * speed;
  let front = 0;

  return createLoop(
    () => {
      front += perTick;

      if (front >= maxRank) {
        setText(element, finalText);
        if (options.onDone) {
          options.onDone();
        }
        return false;
      }

      const out = grid
        .map((row, r) => row
          .map((ch, c) => {
            if (isBlank(ch)) {
              return ch;
            }
            return ranks[r][c] <= front ? ch : ' ';
          })
          .join(''))
        .join('\n');
      setText(element, out);
      return true;
    },
    { fps: options.fps || 30 },
  );
}
