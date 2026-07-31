// Schriftmetrik der Zielschrift. Das Zellraster der ASCII-Art steht und faellt
// mit dem Verhaeltnis von Zeichenbreite zu Zeilenhoehe - wird es geraten, wird
// die Figur breit oder schmal gequetscht. Deshalb wird gemessen, nicht geschaetzt.

const cache = new Map();
let ruler = null;

/**
 * Zeichenbreite einer Monospace-Schrift, bezogen auf die Schriftgroesse.
 * Fuer JetBrains Mono sind das rund 0.6.
 * @param {string} fontFamily
 * @returns {number} Breite je Schriftgroesse, 0.6 als Rueckfallwert
 */
export function measureAdvance(fontFamily) {
  const key = fontFamily || 'monospace';
  if (cache.has(key)) {
    return cache.get(key);
  }

  if (ruler === null) {
    ruler = document.createElement('span');
    ruler.setAttribute('aria-hidden', 'true');
    ruler.style.cssText =
      'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre;'
      + 'font-size:100px;line-height:1;padding:0;border:0;';
  }
  ruler.style.fontFamily = key;
  ruler.textContent = 'MMMMMMMMMM';
  document.body.appendChild(ruler);
  const width = ruler.getBoundingClientRect().width / 1000;
  document.body.removeChild(ruler);

  // Ein unbrauchbarer Messwert (Schrift noch nicht geladen, Element versteckt)
  // darf nicht in den Cache und nicht ins Raster.
  const advance = width > 0.1 && width < 1.2 ? width : 0.6;
  if (width > 0.1 && width < 1.2) {
    cache.set(key, advance);
  }
  return advance;
}

/**
 * Seitenverhaeltnis einer Zelle: Breite geteilt durch Hoehe.
 * @param {string} fontFamily
 * @param {number} lineHeightRatio - Zeilenhoehe je Schriftgroesse
 * @returns {number}
 */
export function cellAspect(fontFamily, lineHeightRatio) {
  return measureAdvance(fontFamily) / (lineHeightRatio || 1);
}
