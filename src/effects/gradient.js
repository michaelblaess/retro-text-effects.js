import { resolveTarget } from '../core/dom.js';

// Gradient: a persistent style treatment that paints a colour gradient across the
// glyphs (via background-clip:text) - top to bottom, left to right, diagonal or at
// a free angle. Three patterns are available: a smooth blend, hard colour bands and
// fixed-width stripes. Optionally the whole pattern keeps flowing along its own
// direction. cancel() restores the original colours.

const DIRECTIONS = {
  down: 180,
  up: 0,
  right: 90,
  left: 270,
  diagonal: 135,
  'diagonal-up': 45,
};

// Farbmuster. Die meisten Paletten laufen von dunkel nach hell, damit ein Verlauf
// von oben nach unten wie eine ausgeleuchtete Roehre wirkt.
const PALETTES = {
  phosphor: ['#0f8f2e', '#33ff33', '#ccffcc'],
  amber: ['#a35a00', '#ffb000', '#ffe9b0'],
  ice: ['#2f6fb0', '#3fa7d6', '#d6f6ff'],
  fire: ['#c02a4a', '#e4572e', '#ffa62b', '#ffef7a'],
  toxic: ['#3f8f10', '#7cff00', '#e4ff9e'],
  gold: ['#b08000', '#ffd700', '#fff6c0'],
  copper: ['#8a4a1e', '#b87333', '#ffd9a0'],
  sunset: ['#5b2b9e', '#7b2ff7', '#ff3c78', '#ff8c42'],
  vaporwave: ['#05ffa1', '#01cdfe', '#b967ff', '#ff71ce'],
  cyberpunk: ['#00f0ff', '#7a5cff', '#ff007a'],
  rainbow: ['#ff3b30', '#ff9500', '#ffee00', '#33ff33', '#00cfff', '#6633ff', '#ff33cc'],
  mono: ['#ffffff', '#5a5a5a'],
};

export const gradientPalettes = Object.keys(PALETTES);
export const gradientDirections = Object.keys(DIRECTIONS);
export const gradientModes = ['smooth', 'bands', 'stripes'];

/**
 * @param {'down'|'up'|'right'|'left'|'diagonal'|'diagonal-up'|number} direction
 * @returns {number} CSS-Winkel in Grad.
 */
function resolveAngle(direction) {
  if (typeof direction === 'number' && Number.isFinite(direction)) {
    return direction;
  }
  const named = DIRECTIONS[direction];
  return named === undefined ? DIRECTIONS.down : named;
}

/**
 * Zaehlt die Textzeilen des Hosts - Basis fuer repeat: 'lines', damit bei mode
 * 'bands' genau eine Farbe je Zeile steht.
 *
 * @param {Element} host
 * @returns {number}
 */
function countLines(host) {
  const text = (host.textContent || '').replace(/\n+$/, '');
  return Math.max(1, text.split('\n').length);
}

/**
 * Misst die Flaeche, die der Text wirklich einnimmt. Ein <pre> ist ein Block und
 * damit meist viel breiter als seine laengste Zeile - ohne diese Messung wuerde
 * ein Verlauf von links nach rechts auf den Glyphen nur seinen ersten Teil zeigen.
 *
 * @param {Element} host
 * @returns {{width: number, height: number}}
 */
function measureText(host) {
  const range = document.createRange();
  range.selectNodeContents(host);
  const rect = range.getBoundingClientRect();
  range.detach();
  return { width: rect.width, height: rect.height };
}

/**
 * Baut das Verlaufsbild. Es ist immer ein repeating-linear-gradient: bei repeat 1
 * sieht das aus wie ein einfacher Verlauf, aber der Versatz laesst sich so nahtlos
 * verschieben, ohne dass an der Kante ein Sprung entsteht.
 *
 * @param {number} angle - CSS-Winkel in Grad.
 * @param {string[]} colors - Farben des Musters.
 * @param {string} mode - 'smooth' | 'bands' | 'stripes'
 * @param {number} step - Laenge einer Farbe, in unit.
 * @param {string} unit - '%' oder 'px'
 * @param {number} offset - Verschiebung entlang der Verlaufsachse, in unit.
 * @returns {string}
 */
function buildImage(angle, colors, mode, step, unit, offset) {
  const stops = [];
  const at = (value) => `${Math.round(value * 1000) / 1000}${unit}`;

  if (mode === 'smooth') {
    // Die erste Farbe steht am Ende noch einmal, damit der Uebergang beim
    // Wiederholen des Musters glatt bleibt.
    for (let i = 0; i <= colors.length; i += 1) {
      stops.push(`${colors[i % colors.length]} ${at(offset + (i * step))}`);
    }
  } else {
    // Harte Kanten: jede Farbe bekommt Anfang UND Ende als eigenen Stop. Die
    // Zwei-Stop-Schreibweise laeuft auch in Engines, die die Kurzform
    // "color a b" noch nicht kennen.
    for (let i = 0; i < colors.length; i += 1) {
      const from = offset + (i * step);
      stops.push(`${colors[i]} ${at(from)}`);
      stops.push(`${colors[i]} ${at(from + step)}`);
    }
  }

  return `repeating-linear-gradient(${angle}deg, ${stops.join(', ')})`;
}

/**
 * Groesse des Verlaufsbildes: entweder genau die Textflaeche oder der ganze
 * Inhaltsbereich des Elements.
 *
 * @param {Element} host
 * @param {boolean} fit - true: an den Text anlegen.
 * @returns {string}
 */
function fitToText(host, fit) {
  if (!fit) {
    return '100% 100%';
  }
  const size = measureText(host);
  if (size.width <= 0 || size.height <= 0) {
    return '100% 100%';
  }
  return `${Math.ceil(size.width)}px ${Math.ceil(size.height)}px`;
}

/**
 * @param {Element|string} target
 * @param {{
 *   direction?: 'down'|'up'|'right'|'left'|'diagonal'|'diagonal-up'|number,
 *   palette?: string,
 *   colors?: string[],
 *   mode?: 'smooth'|'bands'|'stripes',
 *   repeat?: number|'lines',
 *   size?: number,
 *   fit?: boolean,
 *   animate?: boolean,
 *   speed?: number,
 *   onDone?: () => void,
 * }} [options]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function gradient(target, options = {}) {
  const host = resolveTarget(target);
  const angle = resolveAngle(options.direction);
  const mode = gradientModes.indexOf(options.mode) >= 0 ? options.mode : 'smooth';
  const speed = options.speed || 1;

  const custom = Array.isArray(options.colors) && options.colors.length > 0
    ? options.colors
    : null;
  const colors = custom || PALETTES[options.palette] || PALETTES.phosphor;

  const perLine = options.repeat === 'lines';
  const repeat = perLine ? countLines(host) : Math.max(1, Math.round(options.repeat || 1));

  // Streifen haben eine feste Breite in Pixeln, alle anderen Muster teilen sich die
  // Verlaufsachse des Elements auf - so passen sie sich jeder Groesse an.
  const stripes = mode === 'stripes';
  const unit = stripes ? 'px' : '%';
  const size = Math.max(1, options.size || 18);
  // repeat: 'lines' legt genau eine Farbe je Textzeile an, sonst teilt sich die
  // ganze Palette die Achse - repeat mal hintereinander.
  let step;
  if (stripes) {
    step = size;
  } else if (perLine) {
    step = 100 / repeat;
  } else {
    step = (100 / repeat) / colors.length;
  }
  const cycle = step * colors.length;
  // Wandergeschwindigkeit: Streifen in Pixeln je Sekunde, sonst ein voller
  // Durchlauf ueber das Element in fuenf Sekunden.
  const rate = (stripes ? 60 : 20) * speed;

  const previous = {
    backgroundImage: host.style.backgroundImage,
    backgroundSize: host.style.backgroundSize,
    backgroundOrigin: host.style.backgroundOrigin,
    backgroundRepeat: host.style.backgroundRepeat,
    backgroundPosition: host.style.backgroundPosition,
    backgroundClip: host.style.backgroundClip,
    webkitBackgroundClip: host.style.webkitBackgroundClip,
    webkitTextFillColor: host.style.webkitTextFillColor,
    color: host.style.color,
  };

  // content-box: das Verlaufsbild deckt genau den Textbereich ab, ohne Padding.
  // Nur so treffen die Baender bei repeat: 'lines' wirklich die Zeilen.
  host.style.backgroundOrigin = 'content-box';
  host.style.backgroundSize = fitToText(host, options.fit !== false);
  host.style.backgroundRepeat = 'no-repeat';
  host.style.backgroundPosition = '0 0';
  host.style.backgroundClip = 'text';
  host.style.webkitBackgroundClip = 'text';
  host.style.webkitTextFillColor = 'transparent';
  host.style.color = 'transparent';
  host.style.backgroundImage = buildImage(angle, colors, mode, step, unit, 0);

  let raf = null;
  let cancelled = false;
  let start = 0;
  let resolveFinished;
  const finished = new Promise((resolve) => {
    resolveFinished = resolve;
  });

  function restore() {
    host.style.backgroundImage = previous.backgroundImage;
    host.style.backgroundSize = previous.backgroundSize;
    host.style.backgroundOrigin = previous.backgroundOrigin;
    host.style.backgroundRepeat = previous.backgroundRepeat;
    host.style.backgroundPosition = previous.backgroundPosition;
    host.style.backgroundClip = previous.backgroundClip;
    host.style.webkitBackgroundClip = previous.webkitBackgroundClip;
    host.style.webkitTextFillColor = previous.webkitTextFillColor;
    host.style.color = previous.color;
  }

  // Der Versatz wandert entlang der Verlaufsachse, also genau in die Richtung, in
  // die auch der Verlauf zeigt. Weil das Bild ein repeating-Gradient ist, setzt es
  // sich in beide Richtungen fort und der Umlauf bleibt nahtlos.
  function tick(now) {
    if (cancelled) {
      return;
    }
    if (start === 0) {
      start = now;
    }
    const offset = ((now - start) / 1000 * rate) % cycle;
    host.style.backgroundImage = buildImage(angle, colors, mode, step, unit, offset);
    raf = requestAnimationFrame(tick);
  }

  if (options.animate === true) {
    raf = requestAnimationFrame(tick);
  } else if (options.onDone) {
    options.onDone();
  }

  return {
    finished,
    cancel() {
      if (cancelled) {
        return;
      }
      cancelled = true;
      if (raf !== null) {
        cancelAnimationFrame(raf);
      }
      restore();
      resolveFinished();
    },
  };
}
