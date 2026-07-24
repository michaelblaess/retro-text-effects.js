import { animateStage } from '../core/canvas.js';

// Thunderstorm (canvas): lightning bolts strike the block one after another. Each
// strike flashes the scene and lights up a vertical slab of characters, which stay
// glowing, until the whole text has been struck in.

const BOLT_COLOR = '#cfe8ff';

// Baut einen gezackten Blitzpfad von oben bis zur Einschlaghoehe.
function buildBolt(cx, bottom) {
  const points = [{ x: cx, y: 0 }];
  let y = 0;
  while (y < bottom) {
    y += 8 + Math.random() * 16;
    points.push({ x: cx + (Math.random() - 0.5) * 26, y: Math.min(y, bottom) });
  }
  return points;
}

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function thunderstorm(target, options = {}) {
  const speed = options.speed || 1;

  return animateStage(target, options, (stage) => {
    const sorted = stage.targets.slice().sort((a, b) => a.x - b.x);
    const nStrikes = Math.min(12, Math.max(6, Math.round(sorted.length / 12)));
    const chunkSize = Math.ceil(sorted.length / nStrikes);

    const groups = [];
    for (let i = 0; i < sorted.length; i += chunkSize) {
      const chars = sorted.slice(i, i + chunkSize);
      const centroidX = chars.reduce((s, t) => s + t.x, 0) / chars.length;
      const bottom = chars.reduce((m, t) => Math.max(m, t.y), 0) + stage.cellH;
      groups.push({ chars, centroidX, bottom, bolt: null });
    }

    // Reihenfolge der Einschlaege mischen (nicht stur von links nach rechts).
    const order = groups.map((_, i) => i).sort(() => Math.random() - 0.5);
    const interval = 260 / speed;
    order.forEach((groupIndex, position) => {
      groups[groupIndex].strikeTime = position * interval;
    });

    const lastStrike = (nStrikes - 1) * interval;

    return (elapsed) => {
      stage.clear();
      const ctx = stage.ctx;
      let flash = 0;

      for (const g of groups) {
        if (elapsed < g.strikeTime) {
          continue;
        }
        const since = elapsed - g.strikeTime;
        if (g.bolt === null) {
          g.bolt = buildBolt(g.centroidX, g.bottom);
        }

        // Frisch getroffene Zeichen hell, danach in die Zielfarbe abklingen.
        const fresh = since < 160;
        for (const t of g.chars) {
          stage.drawChar(t.ch, t.x, t.y, fresh ? '#ffffff' : undefined);
        }

        // Blitz und Aufhellung nur kurz nach dem Einschlag zeigen.
        if (since < 140) {
          flash = Math.max(flash, 1 - since / 140);
          ctx.strokeStyle = BOLT_COLOR;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(g.bolt[0].x, g.bolt[0].y);
          for (let i = 1; i < g.bolt.length; i += 1) {
            ctx.lineTo(g.bolt[i].x, g.bolt[i].y);
          }
          ctx.stroke();
        }
      }

      if (flash > 0) {
        ctx.fillStyle = `rgba(160, 190, 255, ${0.14 * flash})`;
        ctx.fillRect(0, 0, stage.width, stage.height);
      }

      return elapsed < lastStrike + 450;
    };
  });
}
