// packages
const fs = require('fs')
const each = require('gulp-each')
const concat = require('gulp-concat')
const clean = require('gulp-clean-css')
const replace = require('gulp-replace')
const { src, dest, series, parallel, watch } = require('gulp')

// config
const modules = {
  variables: [
    'variables'
  ],
  ignore: [
    'styles',
    'debug_children',
    'module_template',
    'normalize'
  ],
  static: [
    'debug',
    'debug-children',
    'debug-grid',
    'images'
  ]
}

// parse tachyons variables
const variables = JSON.parse(
                    fs.readFileSync('src/_variables.scss', 'utf8')
                      .replace(/^[^\$]+/gm, '')
                      .replace(/ !default/gm, '')
                      .replace(/(\$[\w-]+): /gm, '"$1": "')
                      .replace(/;/gm, '",')
                      .replace(/"'(.+)'"/gm, '"$1"')
                      .replace(/,\n$/g, '}')
                      .replace(/^./g, '{"')
                  )
// helpers
const modulePaths = (files, prefix = '') => files.map(filename => `${prefix}src/_${filename}.scss`)
const placeholder = () => replace(/^\./gm, '%')
const suffixer = () => replace(/(^[\.%][^:\s,]+)/gm, '$1#{$s}')


function sanitize() {
  return src([
    'src/*',
    ...modulePaths(modules.variables, '!'),
    ...modulePaths(modules.ignore, '!'),
    ...modulePaths(modules.static, '!')
  ]).pipe( replace(/^@.+/gsm, '') )
    .pipe( replace(/^\/\/[^\n]+/gm, '') )
    .pipe( clean({
      format: 'beautify',
      semicolonAfterLastProperty: true
    }) )
    .pipe( replace(/(\n\})/gm, ';$1') )
    .pipe( replace(/,\n[\w\[\]\=]+/gm, '') )
    .pipe( dest('sanitized') )
}


function hyperbeam() {
  return src([
    'sanitized/*'
  ]).pipe( concat('tachyons.scss') )
    .pipe( suffixer() )
    .pipe( placeholder() )
    .pipe( each(function(content, file, callback) {
      let replaced = content
      for (const [key, value] of Object.entries(variables)) {
        let regex = new RegExp(`\\${key};`, 'gm')
        replaced = replaced.replace(regex, value + ';')
      }
      callback(null, replaced)
    }) )
    .pipe( dest('hyperbeam') )
}



exports.sanitize = sanitize
exports.hyperbeam = hyperbeam
exports.default = series(sanitize, hyperbeam)