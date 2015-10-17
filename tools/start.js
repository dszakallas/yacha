
import task from './lib/task';

/**
 * Start the server.
 */
export default task('start', async () => {
  await require('./build')();
  await require('./serve')();

});
