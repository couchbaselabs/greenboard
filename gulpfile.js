 var gulp = require('gulp');
 var gls = require('gulp-live-server');

gulp.task('serve', function() {

  //2. serve at custom port 
  var server = gls.static('app', 3000);
  server.start();
 
  //use gulp.watch to trigger server actions(notify, start or stop) 
  gulp.watch(['index.js'], function (file) {
    server.notify.apply(server, [file]);
  });
});

gulp.task('default', ['serve'])