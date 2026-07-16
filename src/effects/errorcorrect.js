import { resolveTarget, getText, setText } from '../core/dom.js';
import { toLines, toCells, isBlank } from '../core/text.js';
import { createLoop } from '../core/loop.js';

// Error correct: the text appears with a number of character pairs swapped into
// the wrong position; one pair after another swaps back until everything reads
// correctly.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   ratio?: number,
 *   fps?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function errorcorrect(target, options = {}) {
  const element = resolveTarget(target);
  const finalText = getText(element);
  const speed = options.speed || 1;
  const ratio = options.ratio || 0.1;

  const grid = toLines(finalText).map(toCells);
  const positions = [];
  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid[r].length; c += 1) {
      if (!isBlank(grid[r][c])) {
        positions.push({ r, c });
      }
    }
  }

  // Zufaellige Paare vertauschen
  const shuffled = positions.slice().sort(() => Math.random() - 0.5);
  const pairTotal = Math.max(1, Math.floor(positions.length * ratio));
  const pairs = [];
  for (let i = 0; i + 1 < shuffled.length && pairs.length < pairTotal; i += 2) {
    pairs.push([shuffled[i], shuffled[i + 1]]);
  }

  const work = grid.map((row) => row.slice());
  for (const [a, b] of pairs) {
    const tmp = work[a.r][a.c];
    work[a.r][a.c] = work[b.r][b.c];
    work[b.r][b.c] = tmp;
  }

  const render = () => work.map((row) => row.join('')).join('\n');
  setText(element, render());

  let index = 0;
  let tick = 0;
  const ticksPerSwap = Math.max(1, Math.round(4 / speed));

  return createLoop(
    () => {
      tick += 1;
      if (tick % ticksPerSwap === 0 && index < pairs.length) {
        const [a, b] = pairs[index];
        const tmp = work[a.r][a.c];
        work[a.r][a.c] = work[b.r][b.c];
        work[b.r][b.c] = tmp;
        index += 1;
        setText(element, render());
      }

      if (index >= pairs.length) {
        setText(element, finalText);
        if (options.onDone) {
          options.onDone();
        }
        return false;
      }
      return true;
    },
    { fps: options.fps || 30 },
  );
}
