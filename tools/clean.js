import del from 'del'
import fs from './lib/fs'

/**
 * Cleans up the output (build) directory.
 */
export default async function clean () {
  await del(['.tmp', 'build/*', '!build/.git'], {dot: true})
  await fs.makeDir('build/public')
}
