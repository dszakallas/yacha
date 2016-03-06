import webpack from 'webpack'
import config from './config'

/**
 * Bundles JavaScript, CSS and images into one or more packages
 * ready to be used in a browser.
 */
function bundle () {
  return new Promise((resolve, reject) => {
    webpack(config).run((err, stats) => {
      if (err) {
        return reject(err)
      }
      console.log(stats.toString(config[0].stats))
      return resolve()
    })
  })
}

export default bundle
