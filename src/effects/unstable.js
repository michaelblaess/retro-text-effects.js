import { animateStage, easeOutCubic, clamp01 } from '../core/canvas.js';

// Unstable (canvas): the text is briefly visible, becomes unstable, explodes
// outward towards the edges - and reassembles.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function unstable(target, options = {}) {
  const speed = options.speed || 1;

  return animateStage(target, options, (stage) => {
    const cx = stage.width / 2;
    const cy = stage.height / 2;
    const shakeDuration = 500 / speed;
    const explodeDuration = 450 / speed;
    const gatherDuration = 900 / speed;

    const parts = stage.targets.map((t) => {
      // Explosionspunkt: vom Zentrum aus ueber die Zielposition hinaus nach aussen
      const dx = t.x - cx;
      const dy = t.y - cy;
      const len = Math.max(1, Math.hypot(dx, dy));
      const throwDist = 180 + Math.random() * 260;
      return {
        t,
        ex: t.x + (dx / len) * throwDist,
        ey: t.y + (dy / len) * throwDist,
      };
    });

    return (elapsed) => {
      stage.clear();

      if (elapsed < shakeDuration) {
        // Phase 1: Text steht, zittert aber zunehmend
        const intensity = (elapsed / shakeDuration) * 4;
        for (const part of parts) {
          const jx = (Math.random() - 0.5) * intensity;
          const jy = (Math.random() - 0.5) * intensity;
          stage.drawChar(part.t.ch, part.t.x + jx, part.t.y + jy);
        }
        return true;
      }

      const sinceShake = elapsed - shakeDuration;
      if (sinceShake < explodeDuration) {
        // Phase 2: Explosion nach aussen
        const e = easeOutCubic(clamp01(sinceShake / explodeDuration));
        for (const part of parts) {
          const x = part.t.x + (part.ex - part.t.x) * e;
          const y = part.t.y + (part.ey - part.t.y) * e;
          stage.drawChar(part.t.ch, x, y, '#ffffff');
        }
        return true;
      }

      // Phase 3: Wiederzusammensetzen
      const progress = clamp01((sinceShake - explodeDuration) / gatherDuration);
      const e = easeOutCubic(progress);
      for (const part of parts) {
        const x = part.ex + (part.t.x - part.ex) * e;
        const y = part.ey + (part.t.y - part.ey) * e;
        stage.drawChar(part.t.ch, x, y);
      }

      return progress < 1;
    };
  });
}
