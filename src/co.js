const Co = module.exports;

const symbol = require('./symbol');

const echoFunction = function echoFunction(arg) {
  const result = arg;
  return result;
};

const echoGenerator = function* echoGenerator(arg) {
  return arg;
};

Co.ctorObject = ({}).constructor;
Co.ctorArray = [].constructor;
Co.ctorFunction = echoFunction.constructor;
Co.ctorGenerator = echoGenerator.constructor;
Co.ctorIterator = echoGenerator().constructor;
Co.ctorSymbol = Symbol;

symbol('current', null);
symbol('status', null);

symbol('args', function args(...arg) {
  if (!this[status]) this[status] = {context: this};
  this[status].args = arg;
  return this;
});

symbol('context', function context(arg) {
  if (!this[status]) this[status] = {args: []};
  this[status].context = arg || this[status].originalContext || global;
  return this;
});

symbol('halt', function halt(reason) {
  const sta = this[status];
  if (!sta) return false;
  sta.halted = reason || 'halted';
  const cur = this[current];
  if (cur) cur[halt](reason);
  return true;
});

symbol.globalDef('isPromise', obj => (
  obj &&
  obj.then &&
  obj.catch &&
  obj.constructor !== Co.ctorObject
));

const coLaunchObject = function* coLaunchObject(obj, ...args) {
  const result = {};

  for (const i in obj) { // eslint-disable-line
    if (Object.hasOwnProperty.call(obj, i)) {
      const v = obj[i];

      result[i] = (
        v && v.constructor === Co.ctorIterator ?
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
      v && v.constructor === Co.ctorIterator ?
      yield* v :
      yield co.call(this, v, ...args)
    );
  }

  return result;
};

const coLaunchCall = function coLaunchCall(value, ...args) {
  const ctor = value.constructor;
  if (ctor === Co.ctorFunction || ctor === Co.ctorGenerator) return value.apply(this, args);
  else if (ctor === Co.ctorArray) return coLaunchArray.call(this, value, ...args);
  else if (ctor === Co.ctorObject) return coLaunchObject.call(this, value, ...args);
  return value;
};

const coLaunch = function coLaunch(generator, ...args) {
  const value = generator && coLaunchCall.call(this, generator, ...args);
  if (!value) return {promise: Promise.resolve(value)};
  const ctor = value.constructor;
  if (ctor === Co.ctorIterator) return {iterator: value};
  if (value instanceof Promise) return {promise: value};
  return {promise: Promise.resolve(value)};
};

const coNextSymbol = function coNextSymbol(value, continuers) {
  if (value === status) return continuers.status;
  return value;
};

const coGetStatus = function coGetStatus(value, continuers) {
  let sta = value && value[status];
  if (!sta) sta = continuers.status;
  return sta;
};

const coNextCall = function coNextCall(value, status) {
  const ctor = value.constructor;
  const context = status.context;
  const args = status.args;
  if (ctor === Co.ctorFunction) return value.call(context, ...args);
  if (ctor === Co.ctorArray) return coLaunchArray.call(context, value, ...args);
  if (ctor === Co.ctorObject) return coLaunchObject.call(context, value, ...args);
  if (ctor === Co.ctorSymbol) return coNextSymbol.call(context, value, ...args);
  return value;
};

const coNextGenerator = function coNextGenerator(value, status) {
  const ctor = value.constructor;
  const context = status.context;
  if (ctor === Co.ctorGenerator) return co(value.call(context));
  if (ctor === Co.ctorIterator) return co(value);
  return value;
};

const coNextPromise = function coNextPromise(value, continuers) {
  if (!isPromise(value)) return value;

  return (
    (value instanceof Promise ? value : Promise.resolve(value))
    .then(continuers.onFulfilled, continuers.onRejected)
  );
};

const coNext = function coNext(iterated, continuers) {
  if (iterated.done) return Promise.resolve(iterated.value);
  let value = iterated.value;
  if (!value) return value;
  const sta = coGetStatus(value, continuers);
  value = coNextCall(value, sta);
  if (!value) return value;
  value = coNextGenerator(value, sta);
  return coNextPromise(value, continuers);
};

symbol.globalDef('co', function co(generator, ...args) {
  const gotIterator = coLaunch.call(this, generator, ...args);

  if (gotIterator.promise) return gotIterator.promise;

  // let error = new Error() [errstack](1);
  const iterator = gotIterator.iterator;
  const myStatus = {args, context: this};
  const continuers = {status: myStatus};

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

    if (!continuers.promise) continuers.promise = input;
    continuers.promise[current] = input;
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

    continuers.promise[current] = input;
    return input;
  };

  continuers.onFulfilled();
  continuers.promise[status] = myStatus;
  return continuers.promise;
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

      promise = new Promise((ok, nok) => { //eslint-disable-line
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
