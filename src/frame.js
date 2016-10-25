const Frame = module.exports;

const Co = require('./co');

Frame.stay = false;

Frame.exit = code => Co.co(function* exit() {
  Frame.exitCode = code;
  yield* Frame.shutdown(code);
  process.exit(Frame.exitCode);
});

Frame.emergencyExit = () => {
  console.error();
  Frame.exit(1);
};

Frame.exceptionHandler = (err) => {
  console.error(err.stack || err);
  Frame.emergencyExit('error', err);
};

Frame.setHandlers = () => {
  process.on('exit', () => {
    if (!Frame.zombie) console.error('[SAMFIC] Error: Not clean exit');
  });

  process.on('SIGTERM', () => Frame.emergencyExit('SIGTERM'));
  process.on('SIGHUP', () => Frame.emergencyExit('SIGHUP'));
  process.on('SIGINT', () => Frame.emergencyExit('SIGINT'));

  process.on('unhandledException', Frame.exceptionHandler);
};

Frame.super = null;

Frame.get = function get(mod, ...arg) {
  if (Frame.zombie) return null;
  const submod = Object.create(this);
  submod.super = this;
  submod.ready = new Promise((readyResolve) => {
    if (mod) mod.exports = submod;

    if (require.main === mod) {
      Frame.setHandlers(mod);
      Frame.mainModule = submod;
      submod.isMain = true;
    }

    setImmediate(function afterDeclarations() {
      Frame.processInit.call(submod, readyResolve, ...arg);
      Frame.processMain.apply(submod, arg);
    });
  });

  return submod;
};

Frame.ready = true;

Frame.singletons = [];

Frame.processInit = function processInit(readyResolve, ...arg) {
  if (Frame.zombie) return false;
  const me = this;
  if (Object.hasOwnProperty.call(me, 'wasInit')) return true;
  me.wasInit = true;
  if (me.preload) me.preload();
  const superReady = Object.getPrototypeOf(me).ready;

  Co.co(function* initLauncher() {
    yield superReady;
    yield* Frame.processInitialize.apply(me, arg);
    if (me.postInit) yield me.postInit [Co.context](me) [Co.args](...arg);
    readyResolve();
    me.ready = true;
    return true;
  });

  Frame.singletons.push(me);
  return true;
};

Frame.initializer = function* initializer() {
  // empty
};

Frame.finalizer = function* finalizer() {
  // empty
};

Frame.processMain = function processMain(...arg) {
  if (!this.forceMain && Frame.mainModule !== this) return false;
  const me = this;

  const promise = Co.co(function* mainLauncher() {
    yield me.ready;
    if (me.main) return yield me.main [Co.context](me) [Co.args](...arg);
    return me.main;
  });

  if (!me.stay) promise.then(me.exit);
  promise.catch(me.exceptionHandler);
  return true;
};

Frame.processInitialize = function* processInitialize() {
  let cur = this;
  const tree = [];

  do {
    tree.push(cur);
    cur = cur.super;
  } while (cur);

  for (cur of tree) {
    if (Object.hasOwnProperty.call(cur, 'initializer') && cur.initializer) {
      yield cur.initializer [Co.context](this);
    }
  }
};

Frame.processFinalize = function* processFinalize(reason) {
  let cur = this;

  do {
    if (Object.hasOwnProperty.call(cur, 'finalizer') && cur.finalizer) {
      try {
        yield cur.finalizer [Co.context](this) [Co.args](reason);
      } catch (err) {
        Frame.finalizerError(err);
      }
    }

    cur = cur.super;
  } while (cur);
};

Frame.finalizerError = (err) => {
  console.error('[SAMFIC] Error in finalizer:', err.stack || err);
};

Frame.shutdown = function* shutdown(reason) {
  if (Frame.zombie) return false;
  Frame.zombie = true;

  yield* (
    Frame.singletons
    .map(mod => mod.processFinalize(reason))
  );

  return true;
};
