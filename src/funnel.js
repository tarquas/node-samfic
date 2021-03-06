const Funnel = module.exports;

const symbol = require('./symbol');
const Co = require('./co');

Funnel.wrapObject = function* wrapObject(arrayFunnel, values, ...args) {
  const mapped = [];
  const index = {};

  for (const i in values) { // eslint-disable-line
    if (Object.hasOwnProperty.call(values, i)) {
      index[i] = mapped.length;
      mapped.push(values[i]);
    }
  }

  const array = yield* arrayFunnel.call(this, mapped, ...args);
  const results = {};

  for (const i in index) { // eslint-disable-line
    if (Object.hasOwnProperty.call(index, i)) {
      results[i] = array[index[i]];
    }
  }

  return results;
};

Funnel.wrapCall = function* wrapCall(arrayFunnel, values, ...args) {
  const sta = values[Co.status];
  const passArgs = !sta ? args : args.concat(sta.args);
  const context = (sta && sta.context) || this;
  const ctor = values[Co.type];
  if (ctor === Co.types.array) return yield* arrayFunnel.call(context, values, ...passArgs);

  if (ctor === Co.types.object) {
    return yield* Funnel.wrapObject.call(context, arrayFunnel, values, ...passArgs);
  }

  return values;
};

Funnel.allArray = function* allArray(values, ...args) {
  if (!values.length) return [];
  const promises = values.map(value => Co.co.call(this, value, ...args));
  const promise = Promise.all(promises);
  promise[Co.status] = promises.map(item => item[Co.status]);
  promise[Co.halt] = reason => promises.map(item => item [Co.halt](reason));
  const results = yield promise;
  return results;
};

Funnel.all = symbol('all', function* all(...args) {
  const values = this;
  const result = yield* Funnel.wrapCall(Funnel.allArray, values, ...args);
  return result;
});

Funnel.getCount = (values, simCount) => {
  if (simCount >= values.length) return values.length;
  if (!simCount) return 2;
  return simCount;
};

Funnel.indexedResult = (promise, index) => promise.then(result => ({result, index}));

Funnel.tubeArray = function* tubeArray(values, simCount, ...args) {
  if (!values.length) return [];
  const count = Funnel.getCount(values, simCount);
  const mapped = new Array(count).fill(1).map((v, k) => k);
  const promises = values.slice(0, count).map(value => Co.co.call(this, value, ...args));
  const race = promises.map(Funnel.indexedResult);
  const myStatus = {tube: {count}};
  const results = [];

  promises.forEach((promise) => {
    if (promise[Co.status]) promise[Co.status].tube = myStatus.tube;
  });

  const haltFunc = reason => promises.map(item => item [Co.halt](reason));

  for (let next = count; next <= values.length; next++) {
    const promise = Promise.race(race);
    promise[Co.status] = myStatus;
    promise[Co.halt] = haltFunc;
    const done = yield promise;
    const index = done.index;
    results[mapped[index]] = done.result;

    if (next < values.length) {
      mapped[index] = next;
      const nextPromise = Co.co.call(this, values[next], ...args);
      promises[index] = nextPromise;
      race[index] = Funnel.indexedResult(nextPromise, index);
      nextPromise[Co.status].tube = myStatus.tube;
    }
  }

  const lastPromise = Promise.all(promises);
  lastPromise[Co.status] = myStatus;
  lastPromise[Co.halt] = haltFunc;
  const lastResults = yield lastPromise;

  lastResults.forEach((result, index) => {
    results[mapped[index]] = result;
  });

  return results;
};

Funnel.tube = symbol('tube', function* tube(count, ...args) {
  const values = this;
  const result = yield* Funnel.wrapCall(Funnel.tubeArray, values, count, ...args);
  return result;
});

Funnel.batchArray = function* batchArray(values, simCount, ...args) {
  if (!values.length) return [];
  const count = Funnel.getCount(values, simCount);
  let promises;
  const myStatus = {batch: {count}};
  const results = [];

  const assignStatus = (promise) => {
    if (promise[Co.status]) promise[Co.status].batch = myStatus.batch;
  };

  const haltFunc = reason => promises.map(item => item [Co.halt](reason));

  for (let offset = 0; offset < values.length; offset += count) {
    promises = (
      values.slice(offset, count + offset)
      .map(value => Co.co.call(this, value, ...args))
    );

    promises.forEach(assignStatus);

    const promise = Promise.all(promises);
    promise[Co.status] = myStatus;
    promise[Co.halt] = haltFunc;
    const done = yield promise;
    results.push(...done);
  }

  return results;
};

Funnel.batch = symbol('batch', function* batch(count, ...args) {
  const values = this;
  const result = yield* Funnel.wrapCall(Funnel.batchArray, values, count, ...args);
  return result;
});
