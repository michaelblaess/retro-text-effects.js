// Resolves the element that holds the animated text. A <pre> is preferred so
// monospace layout, box-drawing characters and line breaks are preserved - the
// effects only ever rewrite textContent, never the markup around it.

/**
 * @param {Element|string} target - element, or a CSS selector.
 * @returns {Element}
 */
export function resolveTarget(target) {
  if (target === null || target === undefined) {
    throw new Error('retro-text-effects: a target element or selector is required');
  }

  if (typeof target === 'string') {
    const found = document.querySelector(target);
    if (found === null) {
      throw new Error(`retro-text-effects: no element matches "${target}"`);
    }
    return textHost(found);
  }

  return textHost(target);
}

function textHost(element) {
  if (element.tagName === 'PRE') {
    return element;
  }
  const pre = element.querySelector('pre');
  return pre !== null ? pre : element;
}

/**
 * @param {Element} element
 * @returns {string}
 */
export function getText(element) {
  return element.textContent || '';
}

/**
 * @param {Element} element
 * @param {string} text
 */
export function setText(element, text) {
  element.textContent = text;
}
