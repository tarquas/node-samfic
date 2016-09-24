const symbol = require('./symbol');

const echoFunction = function echoFunction(arg) {
  const result = arg;
  return result;
};

const echoGenerator = function* echoGenerator(arg) {
  return arg;
};

symbol.globalDef('ctorObject', ({}).constructor);
symbol.globalDef('ctorFunction', echoFunction.constructor);
symbol.globalDef('ctorGenerator', echoGenerator.constructor);
symbol.globalDef('ctorIterator', echoGenerator().constructor);

symbol('current', null);
symbol('status', null);

symbol('halt', function halt(reason) {
  const sta = this[status];
  if (!sta) return false;
  sta.halted = reason || 'halted';
  const cur = this[current];
  if (cur) cur[halt](reason);
});

symbol.globalDef('isPromise', obj => (
  obj &&
  obj.then &&
  obj.catch &&
  obj.constructor !== ctorObject
));

symbol.globalDef('coLaunch', function coLaunch(generator, ...args) {
  let value = generator;
  let ctor = value && value.constructor;
  if (ctor === ctorFunction || ctor === ctorGenerator) value = value.apply(this, args);
  ctor = value && value.constructor;
  if (ctor === ctorIterator) return {iterator: value};
  if (value instanceof Promise) return {promise: value};
  return {promise: Promise.resolve(value)};
});

symbol.globalDef('coNextGenerator', function coNextGenerator(value, continuers) {
  const ctor = value.constructor;
  if (ctor === ctorGenerator) return co(value.call(continuers.context));
  if (ctor === ctorIterator) return co(value);
});

symbol.globalDef('coNextPromise', function coNextPromise(value, continuers) {
  if (!isPromise(value)) return value;

  return (
    (value instanceof Promise ? value : Promise.resolve(value))
    .then(continuers.onFulfilled, continuers.onRejected)
  );
});

symbol.globalDef('coNext', function coNext(iterated, continuers) {
  if (iterated.done) return Promise.resolve(iterated.value);
  let value = iterated.value;

  if (value && value.constructor === ctorFunction) {
    value = value.call(continuers.context);
  }

  if (!value) return value;
  const nextGen = coNextGenerator(value, continuers);
  if (nextGen) value = nextGen;
  const nextPromise = coNextPromise(value, continuers);
  return nextPromise;
});

symbol.globalDef('co', function co(generator, ...args) {
  const gotIterator = coLaunch.call(this, generator, ...args);

  if (gotIterator.promise) return gotIterator.promise;

  // let error = new Error() [errstack](1);
  const iterator = gotIterator.iterator;
  const myStatus = {};
  let promise;

  const context = this === global ? {} : this;
  context[status] = myStatus;

  const continuers = {context};

  continuers.onFulfilled = (arg) => {
    let input = arg;

    do {
      const halted = myStatus.halted;

      if (halted) {
        // error.message = halted;
        return Promise.reject(halted);
      }

      try {
        input = coNext(iterator.next(input), continuers);
      } catch (err) {
        input = Promise.reject(err);
      }
    } while (!(input instanceof Promise));

    if (promise) promise[current] = input;
    return input;
  };

  continuers.onRejected = (arg) => {
    let input = arg;
    const halted = myStatus.halted;

    if (halted) {
      // error.message = halted;
      return Promise.reject(halted);
    }

    try {
      input = coNext(iterator.throw(input), continuers);
    } catch (err) {
      input = Promise.reject(err);
    }

    if (!(input instanceof Promise)) input = Promise.resolve(input);

    if (promise) promise[current] = input;
    return input;
  };

  promise = continuers.onFulfilled();
  promise[status] = myStatus;
  return promise;
});

symbol.globalDef('delay', function delay(sec) {
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

    if (promise) promise[halt] = myHalt;
  });

  if (myHalt) promise[halt] = myHalt;
  promise[status] = {};
  return promise;
});

symbol('callbacks', function callbacks(...methods) {
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

      promise = new Promise((ok, nok) => {
        let result;

        args.push((err, data) => {
          if (promise) promise[callbacks] = result;
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
