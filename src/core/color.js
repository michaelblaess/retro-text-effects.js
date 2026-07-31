// Farbhelfer. Wandelt #rgb / #rrggbb in ein rgba() mit gewuenschter Deckkraft um
// und gibt alles andere unveraendert zurueck, damit auch benannte Farben oder
// bereits fertige rgb()-Angaben durchgereicht werden koennen.

/**
 * @param {string} color - Hex-Farbe, sonst wird der Wert unveraendert zurueckgegeben.
 * @param {number} alpha - Deckkraft 0..1
 * @returns {string}
 */
export function toRgba(color, alpha) {
  // getComputedStyle liefert rgb()/rgba() statt Hex - beides muss durch.
  const parts = color.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
  if (parts !== null) {
    return `rgba(${parts[1]}, ${parts[2]}, ${parts[3]}, ${alpha})`;
  }

  const hex = color.replace('#', '');
  let r;
  let g;
  let b;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else {
    return color;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
