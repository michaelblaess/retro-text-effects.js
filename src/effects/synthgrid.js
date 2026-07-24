import { animateStage, easeOutCubic, clamp01 } from '../core/canvas.js';

// Synthgrid (canvas): a neon grid grows out from the centre, then the characters
// fill in cell by cell along a diagonal sweep, and finally the grid fades away and
// leaves the finished text behind.

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   color?: string,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function synthgrid(target, options = {}) {
  const speed = options.speed || 1;
  const grid = options.color || '#22d3ee';

  return animateStage(target, options, (stage) => {
    const cx = stage.width / 2;
    const cy = stage.height / 2;
    const gap = Math.max(18, Math.round(stage.cellW * 2));

    const cols = [];
    for (let x = cx % gap; x <= stage.width; x += gap) {
      cols.push(x);
    }
    const rows = [];
    for (let y = cy % gap; y <= stage.height; y += gap) {
      rows.push(y);
    }

    const gridEnd = 900 / speed;
    const fillEnd = gridEnd + 1300 / speed;
    const fadeEnd = fillEnd + 500 / speed;

    const maxRank = stage.width / stage.cellW + stage.height / stage.cellH;

    return (elapsed) => {
      stage.clear();
      const ctx = stage.ctx;

      // Aufbau-, Halte- und Ausblend-Alpha des Gitters bestimmen.
      let gridAlpha = 0.55;
      let build = 1;
      if (elapsed < gridEnd) {
        build = easeOutCubic(clamp01(elapsed / gridEnd));
        gridAlpha = 0.55 * build;
      } else if (elapsed >= fillEnd) {
        gridAlpha = 0.55 * (1 - clamp01((elapsed - fillEnd) / (fadeEnd - fillEnd)));
      }

      // Alpha ueber globalAlpha steuern - funktioniert fuer Hex- und benannte Farben.
      ctx.lineWidth = 1;
      ctx.strokeStyle = grid;
      ctx.globalAlpha = gridAlpha;

      const halfH = (stage.height / 2) * build;
      const halfW = (stage.width / 2) * build;
      ctx.beginPath();
      for (const x of cols) {
        ctx.moveTo(x, cy - halfH);
        ctx.lineTo(x, cy + halfH);
      }
      for (const y of rows) {
        ctx.moveTo(cx - halfW, y);
        ctx.lineTo(cx + halfW, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Zeichen ab Aufbauende diagonal einblenden.
      if (elapsed >= gridEnd) {
        const front = easeOutCubic(clamp01((elapsed - gridEnd) / (fillEnd - gridEnd))) * maxRank;
        for (const t of stage.targets) {
          const rank = t.x / stage.cellW + t.y / stage.cellH;
          if (rank <= front) {
            stage.drawChar(t.ch, t.x, t.y);
          }
        }
      }

      return elapsed < fadeEnd;
    };
  });
}
