import { animateStage, easeOutCubic, clamp01 } from '../core/canvas.js';
import { randInt } from '../core/random.js';

// Scattered (canvas): all characters start at random positions on the stage and
// glide, staggered and eased, to their final spot until the text assembles.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function scattered(target, options = {}) {
  const speed = options.speed || 1;

  return animateStage(target, options, (stage) => {
    const parts = stage.targets.map((t) => ({
      t,
      sx: Math.random() * stage.width,
      sy: Math.random() * stage.height,
      delay: randInt(0, Math.round(900 / speed)),
      duration: (700 + Math.random() * 700) / speed,
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
        const x = part.sx + (part.t.x - part.sx) * eased;
        const y = part.sy + (part.t.y - part.sy) * eased;
        stage.drawChar(part.t.ch, x, y);
      }

      return moving > 0;
    };
  });
}
