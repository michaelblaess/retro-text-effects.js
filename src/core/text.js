// Small text helpers. Array.from is used for character splitting so that
// astral-plane glyphs (surrogate pairs) are treated as single cells.

/**
 * @param {string} text
 * @returns {string[]}
 */
export function toLines(text) {
  return text.split('\n');
}

/**
 * @param {string} line
 * @returns {string[]}
 */
export function toCells(line) {
  return Array.from(line);
}

/**
 * @param {string} ch
 * @returns {boolean}
 */
export function isBlank(ch) {
  return ch === ' ' || ch === '\t' || ch === ' ';
}
