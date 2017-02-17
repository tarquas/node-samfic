const Co = module.exports;

const symbol = require('./symbol');

/* eslint complexity: ['error', 11] */

Co.hasown = symbol('hasown', Object.hasOwnProperty);
Co.type = symbol('type', Object);
Co.typeName = symbol('typeName', Object);
Co.types = symbol.globalDef('types', {});

Co.setTypes = (map) => {
  for (const name in map) {
    if (map [Co.hasown](name)) {
      const value = map[name];
      const ctor = value.constructor;
      const proto = Object.getPrototypeOf(value);
      proto[Co.type] = ctor;
      proto[Co.typeName] = name;
      Co.types[name] = ctor;
    }
  }
};

Co.setFlags = (map) => {
  for (const name in map) {
    if (map [Co.hasown](name)) {
      const types = map[name];
      const prop = symbol(name, false);
      Co[name] = prop;

      for (const type of types) {
        type[prop] = true;
        type.prototype[prop] = true;
      }
    }
  }
};

const echoFunction = function echoFunction(arg) {
  const result = arg;
  return result;
};

const echoGenerator = function* echoGenerator(arg) {
  return arg;
};

Co.setTypes({
  boolean: true,
  number: 1,
  string: 'a',
  date: new Date(),
  object: {},
  array: [],
  function: echoFunction,
  generator: echoGenerator,
  iterator: Object.getPrototypeOf(echoGenerator()),
  symbol: Co.type,
  promise: new Promise(echoFunction)
});

Co.setFlags({
  isPrimitive: [Co.types.boolean, Co.types.number, Co.types.string, Co.types.date],
  isObject: [Co.types.object],
  isArray: [Co.types.array],
  isObjectOrArray: [Co.types.object, Co.types.array],
  isFunction: [Co.types.function],
  isAnyFunction: [Co.types.function, Co.types.generator],
  isPromise: [Co.types.promise]
});

Co.current = symbol('current', null);
Co.status = symbol('status', null);

Co.args = symbol('args', function args(...arg) {
  if (!this[Co.status]) this[Co.status] = {context: this};
  this[Co.status].args = arg;
  return this;
});

Co.context = symbol('context', function context(arg) {
  if (!this[Co.status]) this[Co.status] = {args: []};
  this[Co.status].context = arg || this[Co.status].originalContext || global;
  return this;
});

Co.halt = symbol('halt', function halt(reason, timeout) {
  const from = this[Co.type] === Co.types.promise ? this : Co.co(this);
  const sta = from[Co.status];
  if (!sta) return false;
  sta.halted = reason || 'halted';
  // sta.haltExpire = process.uptime() + (timeout | 0 || 2);
  const cur = from[Co.current];
  if (cur && cur !== from) cur[Co.halt](reason, timeout);
  return true;
});

const coLaunchObject = function* coLaunchObject(obj, ...args) {
  const result = {};

  for (const i in obj) { // eslint-disable-line
    if (Object.hasOwnProperty.call(obj, i)) {
      const v = obj[i];

      result[i] = (
        v && v[Co.type] === Co.types.iterator ?
        yield* v :
        yield co.call(this, v, ...args)
      );
    }
  }

  return result;
};

const coLaunchArray = function* coLaunchArray(obj, ...args) {
  const result = [];

  for (const v of obj) {
    result.push(
      v && v[Co.type] === Co.types.iterator ?
      yield* v :
      yield co.call(this, v, ...args)
    );
  }

  return result;
};

const coLaunchCall = function coLaunchCall(value, ...args) {
  if (value[Co.isAnyFunction]) return value.apply(this, args);
  const ctor = value[Co.type];
  if (ctor === Co.types.array) return coLaunchArray.call(this, value, ...args);
  if (ctor === Co.types.object) return coLaunchObject.call(this, value, ...args);
  return value;
};

const coLaunch = function coLaunch(generator, ...args) {
  const value = generator && coLaunchCall.call(this, generator, ...args);
  if (!value) return {promise: Promise.resolve(value)};
  const ctor = value[Co.type];
  if (ctor === Co.types.iterator) return {iterator: value};
  if (ctor === Co.types.promise) return {promise: value};
  return {promise: Promise.resolve(value)};
};

const coNextSymbol = function coNextSymbol(value, continuers) {
  if (value === status) return continuers.status;
  return value;
};

const coGetStatus = function coGetStatus(value, continuers) {
  let sta = value && value[Co.status];
  if (!sta) sta = continuers.status;
  return sta;
};

const coNext = function coNext(value, continuers) {
  if (!value) return value;
  const status = coGetStatus(value, continuers);
  const ctor = value[Co.type];
  const context = status.context;
  const args = status.args;
  if (ctor === Co.types.function) return value.call(context, ...args);
  if (ctor === Co.types.array) return coLaunchArray.call(context, value, ...args);
  if (ctor === Co.types.object) return coLaunchObject.call(context, value, ...args);
  if (ctor === Co.types.symbol) return coNextSymbol.call(context, value, ...args);
  if (ctor === Co.types.generator) return Co.co(value.call(context));
  if (ctor === Co.types.iterator) return Co.co(value);
  return value;
};

Co.promises = {};
Co.nextId = 0;

Co.co = symbol.globalDef('co', function co(generator, ...args) {
  const gotIterator = coLaunch.call(this, generator, ...args);

  if (gotIterator.promise) return gotIterator.promise;

  // let error = new Error() [errstack](1);
  const iterator = gotIterator.iterator;
  const myStatus = {args, context: this};
  const continuers = {status: myStatus};

  const id = ++Co.nextId;

  continuers.onFulfilled = (arg) => {
    let preInput = null;
    let input = arg;
    let result;

    yieldBlock: try { // eslint-disable-line
      yieldLoop: while (true) { // eslint-disable-line
        result = myStatus.halted ? iterator.throw(myStatus.halted) : iterator.next(input);

        if (result.done) {
          delete Co.promises[id];
          input = myStatus.halted ? Promise.reject(myStatus.halted) : Promise.resolve(result.value);
          break yieldBlock; // eslint-disable-line
        }

        input = result.value;

        checkLoop: while (true) { // eslint-disable-line
          if (!input || input[Co.type][Co.isPrimitive]) continue yieldLoop; // eslint-disable-line

          if (input[Co.type] === Co.types.promise) {
            preInput = input;
            input = input.then(continuers.onFulfilled, continuers.onRejected);
            break yieldBlock; // eslint-disable-line
          }

          input = coNext(input, continuers);
        }
      }
    } catch (err) {
      delete Co.promises[id];
      input = Promise.reject(err);
    }

    continuers.promise[Co.current] = preInput || input;
    return input;
  };

  continuers.onRejected = (arg) => {
    let preInput = null;
    let input = arg;
    let result;

    yieldBlock: try { // eslint-disable-line
      result = iterator.throw(myStatus.halted || input);

      if (result.done) {
        delete Co.promises[id];
        input = myStatus.halted ? Promise.reject(myStatus.halted) : Promise.resolve(result.value);
        break yieldBlock; // eslint-disable-line
      }

      input = result.value;

      checkLoop: while (true) { // eslint-disable-line
        if (!input || input[Co.type][Co.isPrimitive]) input = Promise.resolve(input);

        if (input[Co.type] === Co.types.promise) {
          preInput = input;
          input = input.then(continuers.onFulfilled, continuers.onRejected);
          break yieldBlock; // eslint-disable-line
        }

        input = coNext(input, continuers);
      }
    } catch (err) {
      delete Co.promises[id];
      input = Promise.reject(err);
    }

    continuers.promise[Co.current] = preInput || input;
    return input;
  };

  const pre = continuers.promise = {};
  continuers.promise = continuers.onFulfilled();
  continuers.promise[Co.status] = myStatus;
  continuers.promise[Co.current] = pre[Co.current];
  Co.promises[id] = continuers.promise;
  return continuers.promise;
});

Co.delay = symbol.globalDef('delay', function delay(sec) {
  // let error = new Error() [errstack](1);
  let myHalt;

  let promise;

  promise = new Promise((ok, nok) => { // eslint-disable-line
    if (!sec) return setImmediate(ok);

    const timer = setTimeout(ok, sec * 1000);

    myHalt = (msg) => {
      clearTimeout(timer);
      // error.message = msg || 'halted';
      nok(msg || 'halted');
    };

    if (promise) promise[Co.halt] = myHalt;
  });

  if (myHalt) promise[Co.halt] = myHalt;
  promise[Co.status] = {};
  return promise;
});

Co.timeout = symbol('timeout', function timeout(sec, message) {
  // let error = new Error() [errstack](1);
  const msg = message || 'timeout';
  const from = this[Co.type] === Co.types.promise ? this : Co.co(this);

  let myHalt;
  let promise;

  promise = new Promise((ok, nok) => { // eslint-disable-line
    if (!sec) return setImmediate(() => nok(msg));

    const timer = setTimeout(() => {
      nok(msg);
      this [Co.halt](msg);
    }, sec * 1000);

    from.then((data) => {
      clearTimeout(timer);
      ok(data);
    }).catch((err) => {
      clearTimeout(timer);
      nok(err);
    });

    myHalt = (haltMsg) => {
      clearTimeout(timer);
      // error.message = msg || 'halted';
      nok(haltMsg || 'halted');
    };

    if (promise) promise[Co.halt] = myHalt;
  });

  if (myHalt) promise[Co.halt] = myHalt;
  promise[Co.status] = {};
  return promise;
});

Co.failsafe = symbol('failsafe', function failsafe(options) {
  const from = this[Co.type] === Co.types.promise ? this : Co.co(this);
  const opts = options || {};

  let myHalt;
  let promise;

  promise = new Promise((ok, nok) => { // eslint-disable-line
    from.catch(err => err).then(data => ok(data));

    myHalt = (msg, timeout) => {
      if (!opts.nohalt) {
        from [Co.halt](msg, timeout);
        ok(msg || 'halted');
      }
    };

    if (promise) promise[Co.halt] = myHalt;
  });

  if (myHalt) promise[Co.halt] = myHalt;
  promise[Co.status] = {};
  return promise;
});

Co.nohalt = symbol('nohalt', function nohalt(opts) {
  const newOpts = Object.assign({}, opts, {nohalt: true});
  return this [Co.failsafe](newOpts);
});

Co.callbacks = symbol('callbacks', function callbacks(...methods) {
  const from = this;

  const context = function callbackWrappedContext() {
    return from;
  };

  methods.forEach((method) => {
    let dctx = context;
    let sctx = from;
    const ents = method.split('.');
    const ctxEnts = ents.length - 1;

    for (let i = 0; i < ctxEnts; i++) {
      const ent = ents[i];
      sctx = sctx[ent];
      if (!sctx) return;
      if (!Object.hasOwnProperty.call(dctx, ent)) dctx[ent] = {};
      dctx = dctx[ent];
    }

    const name = ents[ctxEnts];
    const sfunc = sctx[name];
    if (!sfunc) return;

    dctx[name] = function callbackWrapped(...args) {
      const rctx = this === dctx ? sctx : this;
      let promise;

      promise = new Promise((ok, nok) => { //eslint-disable-line
        let result;

        args.push((err, data) => {
          if (promise) promise[Co.callbacks] = result;
          return err ? nok(err) : ok(data);
        });

        result = sfunc.apply(rctx, args);
      });

      return promise;
    };

    dctx[name].name = `${name}CallbackWrapped`;
  });

  return context;
});

Co.shutdownTimeout = 4;
Co.shutdownMessage = (n, sec) => `[SAMFIC] ${n} coroutines timed out for ${sec} and has been halted`;

Co.shutdown = function* shutdown(reason) {
  const waitFor = [];

  for (const id in Co.promises) {
    if (Object.hasOwnProperty.call(Co.promises, id)) {
      const promise = Co.promises[id];
      promise [Co.failsafe]();
      if (!promise.selfShutdown) waitFor.push(promise);
    }
  }

  try {
    for (const pro of waitFor) {
      pro [Co.halt](reason);
    }

    yield (
      Promise.all(waitFor.map(pr => pr [Co.failsafe]()))

      [Co.timeout](
        Co.shutdownTimeout,
        Co.shutdownMessage(waitFor.length, Co.shutdownTimeout)
      )

      [Co.failsafe]()
    );
  } catch (err) {
    console.log('[SAMFIC] Coroutine shutdown failed:', err);
  }
};
