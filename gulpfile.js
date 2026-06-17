const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const concat = require('gulp-concat');

const components = require('prismjs/components.json');

// Prism components are concatenated into a single prism.js. A component frequently
// calls into another component's API (e.g. `Prism.languages.javadoclike.addSupport(...)`),
// so the load ORDER matters: every dependency must be defined before its dependents.
//
// Previously this used an alphabetical glob (`prism-!(*.min).js`), which worked with the
// small component set of old prismjs but breaks on modern prismjs (~300 components with
// deeper dependency chains). We now topologically sort the components using prismjs' own
// `components.json` manifest, which lists each component's `require` dependencies.
const langs = components.languages || {};
const orderedLangs = [];
const seen = new Set();
function visit(id) {
  if (seen.has(id) || !langs[id]) {
    return;
  }
  seen.add(id);
  // `require` may be a single string or an array of strings; normalize to an array.
  const req = langs[id].require;
  const deps = Array.isArray(req) ? req : (typeof req === 'string' ? [req] : []);
  deps.forEach(visit);
  orderedLangs.push(id);
}
Object.keys(langs).forEach(visit);

const componentDir = path.dirname(require.resolve('prismjs/components/prism-core'));

const prismScripts = [
  require.resolve('prismjs/components/prism-core'),
  ...orderedLangs
    .map(id => path.join(componentDir, `prism-${id}.js`))
    .filter(file => fs.existsSync(file)),
];

gulp.task('build-prism', () => gulp.src(prismScripts)
  .pipe(concat('prism.js'))
  .pipe(gulp.dest(path.dirname(require.resolve('prismjs')))));
