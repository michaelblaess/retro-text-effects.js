import { resolveTarget, getText, setText } from '../core/dom.js';
import { toLines, toCells, isBlank } from '../core/text.js';
import { pick } from '../core/random.js';
import { BLOCKS } from '../core/glyphs.js';
import { createLoop } from '../core/loop.js';

// Burn: an ember front eats its way down through the block, column by column with
// a ragged edge; behind the front the burned-in text remains.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   fps?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function burn(target, options = {}) {
  const element = resolveTarget(target);
  const finalText = getText(element);
  const speed = options.speed || 1;

  const grid = toLines(finalText).map(toCells);
  const height = grid.length;
  const width = grid.reduce((max, row) => Math.max(max, row.length), 1);

  // Brennfront pro Spalte mit leicht unterschiedlichem Tempo (ausgefranste Kante)
  const fronts = [];
  for (let c = 0; c < width; c += 1) {
    fronts.push({ y: -Math.random() * 3, rate: (0.25 + Math.random() * 0.35) * speed });
  }

  const render = () =>
    grid
      .map((row, r) => {
        let out = '';
        for (let c = 0; c < row.length; c += 1) {
          if (isBlank(row[c])) {
            out += row[c];
          } else if (r < fronts[c].y - 1) {
            out += row[c];
          } else if (r <= fronts[c].y) {
            out += pick(BLOCKS);
          } else {
            out += ' ';
          }
        }
        return out;
      })
      .join('\n');

  return createLoop(
    () => {
      let burning = 0;
      for (const front of fronts) {
        front.y += front.rate;
        if (front.y <= height + 1) {
          burning += 1;
        }
      }

      if (burning === 0) {
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
