import { resolveTarget, getText, setText } from '../core/dom.js';
import { toLines } from '../core/text.js';
import { randInt } from '../core/random.js';
import { createLoop } from '../core/loop.js';

// Overflow: the rows scroll and reshuffle chaotically for a few cycles, then
// settle into the correct order.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   cycles?: number,
 *   fps?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function overflow(target, options = {}) {
  const element = resolveTarget(target);
  const finalText = getText(element);
  const speed = options.speed || 1;
  const cycles = options.cycles || 3;

  const lines = toLines(finalText);
  const height = Math.max(1, lines.length);
  const totalTicks = Math.max(1, Math.round((height * cycles) / speed));

  let tick = 0;
  let offset = 0;

  const render = () => lines.map((_, i) => lines[(i + offset) % lines.length]).join('\n');

  return createLoop(
    () => {
      tick += 1;
      offset = (offset + 1) % height;
      if (tick % height === 0) {
        offset = randInt(0, height - 1);
      }

      if (tick >= totalTicks) {
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
