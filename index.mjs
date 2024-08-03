import { compressContent } from './utils/compress-content.mjs';
import { readFile, unlink } from 'fs/promises';
import { outputFile } from 'fs-extra';
import { join, basename, dirname } from 'node:path';

/**
 * Gets build output directory based on the esbuild configuration.
 * @type {import('./index.d.ts').getBuildOutputDir}
 */
function getBuildOutputDir({ outfile, outdir}) {
  if (outdir) {
    if (outdir.startsWith('./')) {
      return outdir.substring(2);
    }
    return outdir;
  }
  if (outfile) {
    const dir = dirname(outfile);
    if (dir === '.') {
      return '';
    }
    if (dir.startsWith('./')) {
      return dir.substring(2);
    }
    return dir;
  }
  return '';
//  throw new Error('Either outfile or outdir must be specified in the esbuild configuration');
}

/**
 * Esbuild plugin to compress files after build. Supports gzip and brotli compression.
 * @type {import('./index.d.ts').compressor}
 */
export const compressor = options => ({
  name: 'compressor-plugin',
  setup(build) {
    build.initialOptions.metafile = true;
    build.onEnd(async result => {
      const outputs = result.metafile.outputs;

      const buildOutputDir = getBuildOutputDir(build.initialOptions);
      if (buildOutputDir) {
        const firstOutput = Object.keys(outputs)[0];
        if (firstOutput && !firstOutput.startsWith(buildOutputDir)) {
          throw new Error(`Unexpected build output dir. Expected ${firstOutput} to begin with ${buildOutputDir}.`);
        }
      }

      const outputExt =
        options?.compressType?.toLowerCase() === 'brotli' ? '.br' : '.gz';
      const outdir = options?.outdir || buildOutputDir;

      //process files
      for (const filePath in outputs) {
        const fileType = filePath.substring(filePath.lastIndexOf('.') + 1);

        if (options?.fileTypes?.includes(fileType)) {
          const fileName = basename(filePath);
          const nestedDirs = dirname(filePath).substring(buildOutputDir.length);
          const content = await readFile(filePath, 'utf8');
          const compressedContent = await compressContent(content, options?.compressType);
          const compressedFileName = `${fileName}${outputExt}`;
          const compressedFilePath = join(outdir, nestedDirs, compressedFileName);

          // Save the compressed file to the directory
          await outputFile(compressedFilePath, compressedContent);

          // delete the original file
          if (options?.deleteOrigin) {
            await unlink(filePath);
          }

          console.log(
            `Successfully compressed ${filePath} to ${compressedFilePath}`
          );
        }
      }
    });
  },
});
