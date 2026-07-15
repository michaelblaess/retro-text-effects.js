import esbuild from 'esbuild';

// Bundles the ES-module source into a single, dependency-free IIFE file that
// attaches the API to window.RetroTextEffects. Produces a readable and a
// minified build - both are self-contained and ready to drop into any page.

const banner = {
  js: '/*! retro-text-effects.js | Apache-2.0 | https://github.com/michaelblaess/retro-text-effects.js */',
};

const shared = {
  entryPoints: ['src/index.js'],
  bundle: true,
  format: 'iife',
  globalName: 'RetroTextEffects',
  target: ['es2020'],
  banner,
  legalComments: 'inline',
};

await esbuild.build({
  ...shared,
  outfile: 'dist/retro-text-effects.js',
});

await esbuild.build({
  ...shared,
  minify: true,
  outfile: 'dist/retro-text-effects.min.js',
});

console.log('Build done -> dist/retro-text-effects.js + dist/retro-text-effects.min.js');
