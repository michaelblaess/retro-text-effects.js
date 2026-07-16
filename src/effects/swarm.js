import { animateStage, easeOutCubic, clamp01 } from '../core/canvas.js';

// Swarm (canvas): the characters arrive in small swarms. Each swarm enters from a
// random edge, wobbles along a curved path towards its area of the text and the
// characters settle from the swarm into their final positions.

const SWARM_SIZE = 36;

/**
 * @param {Element|string} target
 * @param {{
 *   speed?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function swarm(target, options = {}) {
  const speed = options.speed || 1;

  return animateStage(target, options, (stage) => {
    const shuffled = stage.targets.slice().sort(() => Math.random() - 0.5);
    const groups = [];

    for (let i = 0; i < shuffled.length; i += SWARM_SIZE) {
      const chars = shuffled.slice(i, i + SWARM_SIZE);
      // Schwerpunkt der Zielpositionen dieses Schwarms
      const centroidX = chars.reduce((sum, t) => sum + t.x, 0) / chars.length;
      const centroidY = chars.reduce((sum, t) => sum + t.y, 0) / chars.length;
      // Start an einer zufaelligen Kante
      const edge = Math.floor(Math.random() * 4);
      const startX = edge === 0 ? -40 : edge === 1 ? stage.width + 40 : Math.random() * stage.width;
      const startY = edge === 2 ? -40 : edge === 3 ? stage.height + 40 : Math.random() * stage.height;

      groups.push({
        chars: chars.map((t) => ({
          t,
          jitterPhase: Math.random() * Math.PI * 2,
          jitterAmp: 10 + Math.random() * 25,
        })),
        startX,
        startY,
        centroidX,
        centroidY,
        // Kontrollpunkt fuer die geschwungene Bahn
        cx: Math.random() * stage.width,
        cy: Math.random() * stage.height,
        delay: (groups.length * 420) / speed,
        duration: 1300 / speed,
      });
    }

    return (elapsed) => {
      stage.clear(0.4);
      let moving = 0;

      for (const group of groups) {
        const progress = clamp01((elapsed - group.delay) / group.duration);
        if (elapsed < group.delay) {
          moving += 1;
          continue;
        }
        if (progress < 1) {
          moving += 1;
        }

        const e = easeOutCubic(progress);
        const inv = 1 - e;
        // Schwarm-Zentrum auf quadratischer Bezier-Kurve
        const swarmX = inv * inv * group.startX + 2 * inv * e * group.cx + e * e * group.centroidX;
        const swarmY = inv * inv * group.startY + 2 * inv * e * group.cy + e * e * group.centroidY;

        for (const member of group.chars) {
          // Innerhalb des Schwarms wuselt jedes Zeichen, das Gewusel klingt zum Ziel hin ab
          const wobble = member.jitterAmp * (1 - e);
          const jx = Math.cos(elapsed / 120 + member.jitterPhase) * wobble;
          const jy = Math.sin(elapsed / 150 + member.jitterPhase) * wobble;
          const offsetX = (member.t.x - group.centroidX) * e;
          const offsetY = (member.t.y - group.centroidY) * e;
          stage.drawChar(member.t.ch, swarmX + offsetX + jx, swarmY + offsetY + jy);
        }
      }

      return moving > 0;
    };
  });
}
