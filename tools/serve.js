/**
 * React Starter Kit (http://www.reactstarterkit.com/)
 *
 * Copyright © 2014-2015 Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import path from 'path';
import cp from 'child_process';
import task from './lib/task';
import watch from './lib/watch';
import browserSync from 'browser-sync';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';


/**
 * Launches Node.js/Express web server in a separate (forked) process.
 */
export default task('serve', () => new Promise((resolve, reject) => {
  function start() {
    const server = cp.fork(path.join(__dirname, '../build/server.js'), {
      env: Object.assign({ NODE_ENV: 'development' }, process.env),
      silent: false,
    });

    server.once('message', message => {
      if (message.match(/^online$/)) {
        resolve();
      }
    });
    server.once('error', err => reject(err));
    process.on('exit', () => server.kill('SIGTERM'));
    return server;
  }

  let server = start();

  if (process.env.WATCH) {
    watch('build/server.js').then(watcher => {
      watcher.on('changed', () => {
        server.kill('SIGTERM');
        server = start();
      });
    });
  }

  if(process.env.BROWSERSYNC) {

    const webpackConfig = require('./config')[0]; // Client-side bundle configuration
    const bundler = webpack(webpackConfig);

    browserSync({
      proxy: {

        target: 'localhost:5000',

        middleware: [
          webpackDevMiddleware(bundler, {
            // IMPORTANT: dev middleware can't access config, so we should
            // provide publicPath by ourselves
            publicPath: webpackConfig.output.publicPath,

            // Pretty colored output
            stats: webpackConfig.stats,

            // For other settings see
            // http://webpack.github.io/docs/webpack-dev-middleware.html
          }),

          // bundler should be the same as above
          webpackHotMiddleware(bundler),
        ],
      },

      // no need to watch '*.js' here, webpack will take care of it for us,
      // including full page reloads if HMR won't work
      files: [
        'build/public/**/*.css',
        'build/public/**/*.html',
        'build/content/**/*.*',
        'build/templates/**/*.*',
      ],
    });

  }

}));
