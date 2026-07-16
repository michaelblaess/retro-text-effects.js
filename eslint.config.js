import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'docs/**'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'build.mjs', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
];
