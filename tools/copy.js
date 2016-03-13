import replace from 'replace';
import task from './lib/task';
import copy from './lib/copy';

/**
 * Copies static files such as robots.txt, favicon.ico to the
 * output (build) folder.
 */
export default task('copy', async () => {
  await Promise.all([
    copy('src/public', 'build/public'),
    copy('package.json', 'build/package.json'),
  ]);

  replace({
    regex: '"start".*',
    replacement: '"start": "node server.js"',
    paths: ['build/package.json'],
    recursive: false,
    silent: false,
  });
});
