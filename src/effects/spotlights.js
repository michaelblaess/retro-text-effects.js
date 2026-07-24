import { animateStage, easeOutCubic, clamp01 } from '../core/canvas.js';

// Spotlights (canvas): a handful of spotlights sweep the dark block and light up
// the characters they pass over. They then converge on the centre and the pooled
// light expands to flood the whole area and reveal the finished text.

const SPOTS = 3;

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function spotlights(target, options = {}) {
  const speed = options.speed || 1;

  return animateStage(target, options, (stage) => {
    const cx = stage.width / 2;
    const cy = stage.height / 2;
    const baseR = Math.min(stage.width, stage.height) * 0.24 + 20;
    const maxR = Math.hypot(stage.width, stage.height);

    const searchEnd = 2200 / speed;
    const convergeEnd = searchEnd + 700 / speed;
    const expandEnd = convergeEnd + 700 / speed;

    const spots = [];
    for (let i = 0; i < SPOTS; i += 1) {
      spots.push({
        fx: 0.0011 + i * 0.0004,
        fy: 0.0014 + i * 0.0005,
        phx: (i / SPOTS) * Math.PI * 2,
        phy: (i / SPOTS) * Math.PI * 2 + 1,
      });
    }

    // Suchbahn (Lissajous) eines Spots zum Zeitpunkt tt.
    const roam = (spot, tt) => ({
      x: cx + Math.sin(tt * spot.fx + spot.phx) * stage.width * 0.36,
      y: cy + Math.sin(tt * spot.fy + spot.phy) * stage.height * 0.36,
    });

    return (elapsed) => {
      stage.clear();
      const ctx = stage.ctx;

      let radius = baseR;
      const positions = spots.map((spot) => {
        if (elapsed < searchEnd) {
          return roam(spot, elapsed);
        }
        if (elapsed < convergeEnd) {
          const e = easeOutCubic(clamp01((elapsed - searchEnd) / (convergeEnd - searchEnd)));
          const s = roam(spot, searchEnd);
          return { x: s.x + (cx - s.x) * e, y: s.y + (cy - s.y) * e };
        }
        return { x: cx, y: cy };
      });

      if (elapsed >= convergeEnd) {
        const e = easeOutCubic(clamp01((elapsed - convergeEnd) / (expandEnd - convergeEnd)));
        radius = baseR + e * maxR;
      }

      // Weiches Licht je Spot.
      for (const pos of positions) {
        const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius);
        grad.addColorStop(0, 'rgba(255, 255, 240, 0.18)');
        grad.addColorStop(1, 'rgba(255, 255, 240, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Nur beleuchtete Zeichen zeichnen.
      for (const t of stage.targets) {
        for (const pos of positions) {
          if (Math.hypot(t.x - pos.x, t.y - pos.y) <= radius) {
            stage.drawChar(t.ch, t.x, t.y);
            break;
          }
        }
      }

      return elapsed < expandEnd;
    };
  });
}
