// http://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true,
  },
  extends: 'airbnb-base',
  // required to lint *.vue files
  plugins: [
    'html'
  ],
  globals: {
    "NODE_ENV": false,
    "VERSION": false
  },
  // check if imports actually resolve
  'settings': {
    'import/resolver': {
      'webpack': {
        'config': 'build/webpack.base.conf.js'
      }
    }
  },
  // add your custom rules here
  'rules': {
    'no-param-reassign': [2, { 'props': false }],
    // don't require .vue extension when importing
    'import/extensions': ['error', 'always', {
      'js': 'never',
      'vue': 'never'
    }],
    // allow optionalDependencies
    'import/no-extraneous-dependencies': ['error', {
      'optionalDependencies': ['test/unit/index.js']
    }],
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    // disable rules that crash the old eslint 4.x parser on template literals
    'template-curly-spacing': 'off',
    'no-unexpected-multiline': 'off',
    // `indent` crashes babel-eslint on template literals too
    // (Cannot read properties of null (reading 'range') in indent.js).
    // Via eslint-loader that turns the offending file into a
    // "Module build failed" throwing stub that breaks the whole bundle at
    // runtime, so keep it off.
    'indent': 'off'
  }
}
