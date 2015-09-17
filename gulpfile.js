'use strict';

var 
  gulp = require('gulp'),
  nightwatch = require('gulp-nightwatch'),
  mocha = require('gulp-mocha');
 


gulp.task('build', function() {

});

gulp.task('test-unit', function () {
    return gulp.src('tests/unit/**/*_test.js', {read: false})
        // gulp-mocha needs filepaths so you can't have any plugins before it 
        .pipe(mocha({reporter: 'nyan'}));
});


gulp.task('test-e2e', function() {

  var app = require('./lib/app');

  app.runAsync(8080, function(server){
    var test = gulp.src('')
      .pipe(nightwatch({
        configFile: 'nightwatch.json'
      }));

    test.on('end', function(){
      server.close();
      return test;
    });

  });


});

gulp.task('test', ['test-unit', 'test-e2e']);

gulp.task('default', ['build', 'test']);