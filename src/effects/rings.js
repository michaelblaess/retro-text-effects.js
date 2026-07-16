import { animateStage, easeOutCubic, clamp01 } from '../core/canvas.js';

// Rings (canvas): the characters gather on concentric spinning rings around the
// centre, orbit for a moment and then disperse to their final positions.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function rings(target, options = {}) {
  const speed = options.speed || 1;

  return animateStage(target, options, (stage) => {
    const cx = stage.width / 2;
    const cy = stage.height / 2;
    const maxRadius = Math.min(stage.width, stage.height) * 0.42;
    const ringCount = Math.max(2, Math.min(6, Math.floor(maxRadius / (stage.cellH * 1.5))));
    const spinDuration = 1500 / speed;
    const disperseDuration = 850 / speed;

    const parts = stage.targets.map((t, i) => {
      const ring = i % ringCount;
      return {
        t,
        radius: maxRadius * ((ring + 1) / ringCount),
        angle: (i / Math.max(1, stage.targets.length)) * Math.PI * 2 * ringCount,
        // Innere Ringe drehen schneller, Richtung alternierend
        rotation: (1.2 - ring * 0.15) * (ring % 2 === 0 ? 1 : -1),
      };
    });

    return (elapsed, dt) => {
      stage.clear(0.35);
      const dtS = (dt * speed) / 1000;

      if (elapsed < spinDuration) {
        for (const part of parts) {
          part.angle += part.rotation * dtS;
          const x = cx + Math.cos(part.angle) * part.radius;
          const y = cy + Math.sin(part.angle) * part.radius * 0.6;
          stage.drawChar(part.t.ch, x, y);
        }
        return true;
      }

      const progress = clamp01((elapsed - spinDuration) / disperseDuration);
      const e = easeOutCubic(progress);

      for (const part of parts) {
        // Von der letzten Ringposition zur Zielposition
        const ringX = cx + Math.cos(part.angle) * part.radius;
        const ringY = cy + Math.sin(part.angle) * part.radius * 0.6;
        const x = ringX + (part.t.x - ringX) * e;
        const y = ringY + (part.t.y - ringY) * e;
        stage.drawChar(part.t.ch, x, y);
      }

      return progress < 1;
    };
  });
}
