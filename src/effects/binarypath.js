import { animateStage } from '../core/canvas.js';
import { randInt } from '../core/random.js';

// Binarypath (canvas): every character enters as a little stream of 0s and 1s from
// outside the block and travels to its target at right angles - first horizontally
// to the correct column, then vertically to the correct row - before it locks in
// and resolves to the real glyph.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function binarypath(target, options = {}) {
  const speed = options.speed || 1;

  return animateStage(target, options, (stage) => {
    const travelers = stage.targets.map((t) => {
      const fromLeft = Math.random() < 0.5;
      const startX = fromLeft ? -40 : stage.width + 40;
      const startY = Math.random() * stage.height;
      const legX = Math.abs(t.x - startX);
      const legY = Math.abs(t.y - startY);
      return {
        t,
        startX,
        startY,
        legX,
        legY,
        length: legX + legY,
        pxPerSec: (260 + Math.random() * 200) * speed,
        delay: randInt(0, Math.round(900 / speed)),
        bit: Math.random() < 0.5 ? 0 : 1,
        arrived: false,
      };
    });

    return (elapsed) => {
      stage.clear();
      let moving = 0;

      for (const tr of travelers) {
        if (tr.arrived) {
          stage.drawChar(tr.t.ch, tr.t.x, tr.t.y);
          continue;
        }

        moving += 1;
        if (elapsed < tr.delay) {
          continue;
        }

        const dist = ((elapsed - tr.delay) / 1000) * tr.pxPerSec;
        if (dist >= tr.length) {
          tr.arrived = true;
          stage.drawChar(tr.t.ch, tr.t.x, tr.t.y);
          continue;
        }

        // Erst die horizontale Strecke, danach die vertikale (rechter Winkel).
        let x;
        let y;
        if (dist < tr.legX) {
          x = tr.startX + Math.sign(tr.t.x - tr.startX) * dist;
          y = tr.startY;
        } else {
          x = tr.t.x;
          y = tr.startY + Math.sign(tr.t.y - tr.startY) * (dist - tr.legX);
        }

        const glyph = (Math.floor(elapsed / 70) + tr.bit) % 2 === 0 ? '0' : '1';
        stage.drawChar(glyph, x, y);
      }

      return moving > 0;
    };
  });
}
