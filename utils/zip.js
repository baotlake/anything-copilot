import gulp from 'gulp'
import zip from 'gulp-zip'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const manifest = require('../dist/manifest.json')

gulp
  .src('dist/**')
  .pipe(zip(`anything-copilot-${manifest.version}.zip`))
  .pipe(gulp.dest('package'))