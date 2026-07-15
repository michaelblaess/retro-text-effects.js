import { resolveTarget, getText, setText } from '../core/dom.js';
import { toLines, toCells, isBlank } from '../core/text.js';
import { randInt, pick } from '../core/random.js';
import { DEFAULT_GLYPHS } from '../core/glyphs.js';
import { createLoop } from '../core/loop.js';

// Decrypt: every cell flickers through random glyphs and then locks onto its
// final character. Whitespace is kept stable so a framed layout does not jump.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   glyphs?: string,
 *   preserveWhitespace?: boolean,
 *   fps?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function decrypt(target, options = {}) {
  const element = resolveTarget(target);
  const finalText = getText(element);
  const glyphs = options.glyphs ? Array.from(options.glyphs) : DEFAULT_GLYPHS;
  const preserveWhitespace = options.preserveWhitespace !== false;
  const speed = options.speed || 1;

  const rows = toLines(finalText).map((line) =>
    toCells(line).map((ch) => {
      const keep = preserveWhitespace && isBlank(ch);
      return {
        ch,
        flips: keep ? 0 : Math.max(1, Math.round(randInt(6, 34) / speed)),
        current: keep ? ch : pick(glyphs),
      };
    }),
  );

  const render = () => rows.map((row) => row.map((c) => c.current).join('')).join('\n');

  return createLoop(
    () => {
      let unresolved = 0;
      for (const row of rows) {
        for (const cell of row) {
          if (cell.flips > 0) {
            cell.flips -= 1;
            cell.current = cell.flips === 0 ? cell.ch : pick(glyphs);
            if (cell.flips > 0) {
              unresolved += 1;
            }
          }
        }
      }

      if (unresolved === 0) {
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
