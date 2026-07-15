// Glyph pools the scramble-style effects cycle through before a cell resolves.

export const SYMBOLS = Array.from('!<>-_\\/[]{}=+*^?#$%&@');
export const DIGITS = Array.from('0123456789');
export const BLOCKS = Array.from('░▒▓█'); // shade + full block
export const MATRIX = Array.from(
  'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸ0123456789',
);

export const DEFAULT_GLYPHS = SYMBOLS.concat(DIGITS, BLOCKS);
