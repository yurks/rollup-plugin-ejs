'use strict';

var pluginutils = require('@rollup/pluginutils');
var ejs = require('ejs');
var fs = require('fs');
var path = require('path');
var sass = require('node-sass');
var htmlMinifier = require('html-minifier');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var sass__default = /*#__PURE__*/_interopDefaultLegacy(sass);

const linkTagRegEx = /<link(?=.*\shref=['|"]([\w$-_.+!*'(),]*)['|"])(?=.*\srel=['|"]stylesheet['|"]).*>/g;
const readStyleFile = (tplFilePath, href) => fs__default['default'].readFileSync(path__default['default'].resolve(path__default['default'].parse(tplFilePath).dir, href), 'utf8');
const defaultCompilerOptions = {client: true, strict: true};

const compilers = {
  css: readStyleFile,
  scss: (tplFilePath, href) => {
    const compiled = sass__default['default'].renderSync({
      data: readStyleFile(tplFilePath, href),
      importer: (url, prev) => ({file: path__default['default'].resolve(path__default['default'].parse(prev === 'stdin' ? tplFilePath : prev).dir, url)}),
    });

    return compiled.css.toString('utf8');
  },
};

const loadStylesTo = (code, tplFilePath) =>
  code.replace(linkTagRegEx, (match, href) => href
    ? `<style>${compilers[path__default['default'].extname(href).substr(1)](tplFilePath, href)}</style>`
    : '');

const renderCode = (templateFn, render, minifierOptions) => {
  if (render) {
    const {data, minifierOptions: minifierOptionsLegacy} = render;
    minifierOptions = minifierOptions || minifierOptionsLegacy;

    return JSON.stringify(minifierOptions ? htmlMinifier.minify(templateFn(data), minifierOptions) : templateFn(data));
  }

  return templateFn.toString();
};

var index = ({
  include, exclude, loadStyles, render, minifierOptions,
  compilerOptions = defaultCompilerOptions,
} = {}) => {
  const filter = pluginutils.createFilter(include || ['**/*.ejs'], exclude);

  return {
    name: 'ejs',

    transform: function transform(code, tplFilePath) {
      if (filter(tplFilePath)) {
        const codeToCompile = loadStyles ? loadStylesTo(code, tplFilePath) : code;
        const templateFn = ejs.compile(minifierOptions ? htmlMinifier.minify(codeToCompile, minifierOptions) : codeToCompile, Object.assign(defaultCompilerOptions, compilerOptions));

        return {
          code: `export default ${renderCode(templateFn, render, minifierOptions)};`,
          map: {mappings: ''},
        };
      }
    },
  };
};

module.exports = index;
