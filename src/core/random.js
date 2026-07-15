// Thin random helpers. The library uses Math.random directly - reproducible
// seeding can be layered on later without touching the effect code.

/**
 * Inclusive integer in [min, max].
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * @template T
 * @param {T[]} items
 * @returns {T}
 */
export function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}
