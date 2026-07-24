import { animateStage } from '../core/canvas.js';

// Smoke (canvas): a wall of drifting smoke rolls across the block from the left.
// Every character the smoke has crossed is left colourised behind it, so the text
// fades in under the passing haze.

const PUFFS = 22;

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function smoke(target, options = {}) {
  const speed = options.speed || 1;

  return animateStage(target, options, (stage) => {
    const frontSpeed = ((stage.width + 140) / 2600) * speed; // px pro ms
    const puffs = [];
    for (let i = 0; i < PUFFS; i += 1) {
      puffs.push({
        ox: (Math.random() - 0.5) * 150,
        y: Math.random() * stage.height,
        r: 34 + Math.random() * 52,
        phase: Math.random() * Math.PI * 2,
      });
    }

    return (elapsed) => {
      stage.clear();
      const front = -70 + elapsed * frontSpeed;

      // Zeichen, die der Rauch bereits ueberquert hat, farbig stehen lassen.
      for (const t of stage.targets) {
        const rowFront = front + Math.sin(t.y * 0.03) * 18;
        if (t.x <= rowFront) {
          stage.drawChar(t.ch, t.x, t.y);
        }
      }

      // Die driftende Rauchwand ueber der Frontkante zeichnen.
      const ctx = stage.ctx;
      for (const p of puffs) {
        const px = front + p.ox + Math.sin(elapsed / 500 + p.phase) * 16;
        const py = p.y + Math.sin(elapsed / 700 + p.phase) * 12;
        const grad = ctx.createRadialGradient(px, py, 0, px, py, p.r);
        grad.addColorStop(0, 'rgba(170, 175, 185, 0.20)');
        grad.addColorStop(1, 'rgba(170, 175, 185, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      return front <= stage.width + 90;
    };
  });
}
