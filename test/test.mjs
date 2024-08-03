import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, accessSync, constants } from 'node:fs';
import * as esbuild from 'esbuild';

import { compressor } from '../index.mjs';

const outputPath = './test-output';
const testData = './test-data';

test('nested directory structure', async t => {
  beforeEach(setupOutput);

  const plugin = compressor({
    fileTypes: ['js'],
    compressType: 'gzip',
  });
/*
  await t.test('outdir-based', async t => {
    await esbuild.build({
      entryPoints: [`${testData}/entry1.mjs`],
      entryNames: 'entry/[name]',
      outdir: `${outputPath}/outdir`,
      plugins: [plugin],
    }); 
    accessSync(`${outputPath}/outdir/entry/entry1.js.gz`, constants.F_OK);
  });

  await t.test('outfile-based', async t => {
    await esbuild.build({
      entryPoints: [`${testData}/entry1.mjs`],
      outfile: `${outputPath}/outfile/outfile.js`,
      plugins: [plugin],
    }); 
    accessSync(`${outputPath}/outfile/outfile.js.gz`, constants.F_OK);
  });
*/
  await t.test('entrypoint out-based', async t => {
    await esbuild.build({
      entryPoints: [{in: `${testData}/entry1.mjs`, out: 'entryPointOut/out'}],

      plugins: [plugin],
    }); 
    accessSync(`${outputPath}/entryPointOut/out.js.gz`, constants.F_OK);
  });

});

function setupOutput() {
  rmSync(outputPath, { recursive: true, force: true });
  mkdirSync(outputPath);
}
