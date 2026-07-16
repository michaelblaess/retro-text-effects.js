import { animateStage, easeOutCubic, clamp01 } from '../core/canvas.js';
import { randInt } from '../core/random.js';

// Expand (canvas): the whole text bursts outward from the centre of the stage,
// every character easing to its final position.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function expand(target, options = {}) {
  const speed = options.speed || 1;

  return animateStage(target, options, (stage) => {
    const cx = stage.width / 2;
    const cy = stage.height / 2;
    const parts = stage.targets.map((t) => ({
      t,
      delay: randInt(0, Math.round(300 / speed)),
      duration: (500 + Math.random() * 500) / speed,
    }));

    return (elapsed) => {
      stage.clear();
      let moving = 0;

      for (const part of parts) {
        const progress = clamp01((elapsed - part.delay) / part.duration);
        if (progress < 1) {
          moving += 1;
        }
        const eased = easeOutCubic(progress);
        const x = cx + (part.t.x - cx) * eased;
        const y = cy + (part.t.y - cy) * eased;
        stage.drawChar(part.t.ch, x, y);
      }

      return moving > 0;
    };
  });
}
