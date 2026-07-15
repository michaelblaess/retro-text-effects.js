import { resolveTarget, getText, setText } from '../core/dom.js';
import { toLines, toCells } from '../core/text.js';
import { createLoop } from '../core/loop.js';

// Print: reveals the text in reading order like a line printer, with a block
// print head at the current position. Not-yet-printed cells render as spaces so
// the final width (and any box frame) stays intact while it fills in.

/**
 * @param {Element|string} target
 * @param {{
 *   cps?: number,
 *   speed?: number,
 *   head?: string,
 *   fps?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function print(target, options = {}) {
  const element = resolveTarget(target);
  const finalText = getText(element);
  const fps = options.fps || 30;
  const cps = (options.cps || 60) * (options.speed || 1);
  const head = options.head || '█';

  const lines = toLines(finalText).map(toCells);
  const total = lines.reduce((sum, cells) => sum + cells.length, 0);

  const render = (count) => {
    let seen = 0;
    return lines
      .map((cells) => {
        let out = '';
        for (const ch of cells) {
          if (seen < count) {
            out += ch;
          } else if (seen === count) {
            out += head;
          } else {
            out += ' ';
          }
          seen += 1;
        }
        return out;
      })
      .join('\n');
  };

  let printed = 0;

  return createLoop(
    () => {
      printed += cps / fps;
      const count = Math.floor(printed);

      if (count >= total) {
        setText(element, finalText);
        if (options.onDone) {
          options.onDone();
        }
        return false;
      }

      setText(element, render(count));
      return true;
    },
    { fps },
  );
}
