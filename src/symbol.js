const packageInfo = require('../package');

/* eslint complexity: ['error', 6] */

const version = (
  packageInfo.version
  .split('.')
  .map((v, k) => v * Math.pow(10, -k * 3))
  .reduce((v1, v2) => v1 + v2)
);

const symbol = (name, def) => {
  let sym = global[name];
  // if (sym && sym.constructor !== Symbol) console.log('already defined:', name);

  if (!sym || sym.constructor !== Symbol) {
    sym = Symbol(name);
    if (!global.samficNoGlobals) global[name] = sym;
  }

  const objproto = Object.prototype;
  if (!objproto[sym] || symbol.newVersion) objproto[sym] = def;
  return sym;
};

symbol.globalDef = (name, def) => {
  if (!global.samficNoGlobals && (!global[name] || symbol.newVersion)) global[name] = def;
  return def;
};

symbol.newVersion = !global.samficVersion || version > samficVersion;

module.exports = symbol;
