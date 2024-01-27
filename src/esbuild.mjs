/* eslint-disable import/no-extraneous-dependencies */
import * as esbuild from 'esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';

const watch = process.argv.includes('--watch');

const context = {
  entryPoints: ['index.ts', 'styles.sass'],
  external: ['*.ttf'],
  platform: 'browser',
  sourcemap: false,
  bundle: true,
  minify: true,
  plugins: [sassPlugin()],
  target: 'es2020',
  outdir: '../public/lib',
};

if (watch) {
  context.sourcemap = true;
  const instance = await esbuild.context(context);
  await instance.watch();
} else {
  await esbuild.build();
}
