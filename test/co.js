const CoTest = module.exports;

const chai = require('chai');

require('../src/co');

CoTest.launchGenerator = function* launchGenerator(input1, input2) {
  chai.expect(input1).to.equal(1);
  chai.expect(input2).to.equal(2);
  return input1 + input2;
};

CoTest.launchFunction = function launchFunction(input) {
  chai.expect(input).to.equal(4);
  return input + 1;
};

CoTest.launchUndefined = function launchUndefined(input) {
  chai.expect(input).to.equal(undefined);
  return null;
};

CoTest.launchAction = input => Promise.resolve(input + 1);

CoTest.waitedFunction = function waitedFunction() {
  return 25;
};

CoTest.waitedAction = () => Promise.resolve(27);

CoTest.fastWaitForIterator = function* fastWaitForIterator() {
  const result = yield* CoTest.launchGenerator(1, 2);
  chai.expect(result).to.equal(3);
  return result + 3;
};

CoTest.waitForIterator = function* waitForIterator() {
  const result = yield CoTest.launchGenerator(1, 2);
  chai.expect(result).to.equal(3);
  return result + 3;
};

CoTest.waitForGenerator = function* waitForGenerator() {
  const result = 1 + (yield CoTest.fastWaitForIterator);
  chai.expect(result).to.equal(7);
  return result + 3;
};

CoTest.waitForFunction = function* waitForFunction() {
  const result = 1 + (yield CoTest.waitedFunction);
  chai.expect(result).to.equal(26);
  return result + 3;
};

CoTest.waitForAction = function* waitForAction() {
  const result = 1 + (yield CoTest.waitedAction);
  chai.expect(result).to.equal(28);
  return result + 3;
};

CoTest.waitForPromise = function* waitForPromise() {
  const result = 1 + (yield Promise.resolve(19));
  chai.expect(result).to.equal(20);
  return result + 3;
};

CoTest.waitForValue = function* waitForValue() {
  const result = 1 + (yield 13);
  chai.expect(result).to.equal(14);
  return result + 3;
};

CoTest.waitForFalsyValue = function* waitForFalsyValue() {
  const result = yield;
  chai.expect(result).to.equal(undefined);
  return null;
};

CoTest.waitForObject = function* waitForObject() {
  const result = yield ({
    ofIterator: CoTest.launchGenerator(1, 2),
    ofAction: CoTest.launchAction(6),
    ofPromise: Promise.resolve(81),
    ofValue: 82,
    ofFalsyValue: undefined
  });

  chai.expect(result).to.deep.equal({
    ofIterator: 3,
    ofAction: 7,
    ofPromise: 81,
    ofValue: 82,
    ofFalsyValue: undefined
  });

  return result;
};

CoTest.waitForArray = function* waitForArray() {
  const result = yield [
    CoTest.launchGenerator(1, 2),
    CoTest.launchAction(6),
    Promise.resolve(83),
    84,
    undefined
  ];

  chai.expect(result).to.deep.equal([3, 7, 83, 84, undefined]);
  return result;
};

CoTest.launchContext = function* launchContext(input) {
  return this + input;
};

CoTest.context = context;

CoTest.waitForObjectCustom = function* waitForObjectCustom() {
  const result = yield ({
    ofGenerator: CoTest.launchGenerator,
    ofContext: CoTest.launchContext,
    ofAction: CoTest.launchAction,
    ofPromise: Promise.resolve(81),
    ofValue: 82,
    ofFalsyValue: undefined
  }) [args](1, 2) [CoTest.context](3);

  chai.expect(result).to.deep.equal({
    ofGenerator: 3,
    ofContext: 4,
    ofAction: 2,
    ofPromise: 81,
    ofValue: 82,
    ofFalsyValue: undefined
  });

  return result;
};

CoTest.waitForArrayCustom = function* waitForArrayCustom() {
  const result = yield [
    CoTest.launchGenerator,
    CoTest.launchContext,
    CoTest.launchAction,
    Promise.resolve(83),
    84,
    undefined
  ] [args](1, 2) [CoTest.context](3);

  chai.expect(result).to.deep.equal([3, 4, 2, 83, 84, undefined]);
  return result;
};

CoTest.waitForDelay = function* waitForDelay() {
  const startAt = process.uptime();
  yield delay(1 / 10);
  const duration = Math.round((process.uptime() - startAt) * 10);
  chai.expect(duration).to.equal(1);
  return duration;
};

CoTest.callbacks = {
  delay(sec, callback) {
    if (!sec) return setImmediate(callback, null, this);
    return setTimeout(callback, sec * 1000, null, this);
  }
};

CoTest.wrapped = CoTest[callbacks]('callbacks.delay');

CoTest.waitForDelayCallback = function* waitForDelayCallback() {
  const startAt = process.uptime();
  const context = yield CoTest.wrapped.callbacks.delay(1 / 10);
  const duration = Math.round((process.uptime() - startAt) * 10);
  chai.expect(duration).to.equal(1);
  chai.expect(context).to.equal(CoTest.callbacks);
  chai.expect(CoTest.wrapped()).to.equal(CoTest);
  return duration;
};

CoTest.waitForDelayHalt = function* waitForDelayHalt() {
  const startAt = process.uptime();
  const delayed = delay(3 / 10);

  co(function* delayedHalt() {
    yield delay(1 / 10);
    delayed[halt]('halt test');
  });

  try {
    yield delayed;
  } catch (err) {
    chai.expect(err).to.equal('halt test');
  }

  const duration = Math.floor((process.uptime() - startAt) * 10);
  chai.expect(duration).to.equal(1);
  return duration;
};

CoTest.waitForArrayHalt = function* waitForArrayHalt() {
  let sum = 0;

  let promise;

  promise = co(function* arrayHaltTest() { // eslint-disable-line
    yield [
      function* step1() {
        sum += 1;
      },

      function* step2() {
        sum += 2;
        promise[halt]();
      },

      function* step3() {
        sum += 4;
      }
    ];
  });

  try {
    yield promise;
    throw 'promise succeeded';
  } catch (err) {
    chai.expect(err).to.equal('halted');
  }

  chai.expect(sum).to.equal(3);
  return sum;
};

CoTest.waitForObjectHalt = function* waitForObjectHalt() {
  let sum = 0;

  let promise;

  promise = co(function* arrayHaltTest() { // eslint-disable-line
    yield ({
      * step1() {
        sum += 1;
      },

      * step2() {
        sum += 2;
        promise[halt]('halt test');
      },

      * step3() {
        sum += 4;
      }
    });
  });

  try {
    yield promise;
    throw 'promise succeeded';
  } catch (err) {
    chai.expect(err).to.equal('halt test');
  }

  chai.expect(sum).to.equal(3);
  return sum;
};

CoTest.yieldIterTime = function* yieldIterTime(iters) {
  const startAt = process.uptime();
  for (let i = 0; i < iters; i++) yield CoTest.waitForIterator();
  const duration = process.uptime() - startAt;
  return duration;
};

CoTest.yieldDelegatedIterTime = function* yieldDelegatedIterTime(iters) {
  const startAt = process.uptime();
  for (let i = 0; i < iters; i++) yield* CoTest.fastWaitForIterator();
  const duration = process.uptime() - startAt;
  return duration;
};

CoTest.iterDelegationMustBeFaster = function* iterDelegationMustBeFaster() {
  const iters = 1000;
  const yieldIterDuration = yield CoTest.yieldIterTime(iters);
  const yieldDelegatedIterDuration = yield* CoTest.yieldDelegatedIterTime(iters);
  console.log('wait for promisified iterator:', yieldIterDuration.toFixed(3), 'seconds');
  console.log('fast wait for iterator:', yieldDelegatedIterDuration.toFixed(3), 'seconds');
  console.log((yieldIterDuration / yieldDelegatedIterDuration).toFixed(1), 'times faster');
  chai.expect(yieldIterDuration).to.be.above(yieldDelegatedIterDuration);
};

describe('test co', function testCo() {
  this.timeout(10000);
  it('should launch iterator', () => co(CoTest.launchGenerator(1, 2)));
  it('should launch generator', () => co(CoTest.launchGenerator, 1, 2));
  it('should launch function', () => co(CoTest.launchFunction, 4));
  it('should launch promise', () => co(Promise.resolve(4)).then(CoTest.launchFunction));
  it('should launch action', () => co(CoTest.launchAction, 3).then(CoTest.launchFunction));
  it('should launch value', () => co(4).then(CoTest.launchFunction));
  it('should launch falsy value', () => co().then(CoTest.launchUndefined));
  it('should fast wait for iterator', () => co(CoTest.fastWaitForIterator));
  it('should wait for iterator', () => co(CoTest.waitForIterator));
  it('should wait for generator', () => co(CoTest.waitForGenerator));
  it('should wait for function', () => co(CoTest.waitForFunction));
  it('should wait for action', () => co(CoTest.waitForAction));
  it('should wait for promise', () => co(CoTest.waitForPromise));
  it('should wait for value', () => co(CoTest.waitForValue));
  it('should wait for array', () => co(CoTest.waitForArray));
  it('should wait for object', () => co(CoTest.waitForObject));
  it('should wait for array with custom context', () => co(CoTest.waitForArrayCustom));
  it('should wait for object with custom context', () => co(CoTest.waitForObjectCustom));
  it('should wait for falsy value', () => co(CoTest.waitForFalsyValue));
  it('should wait for delay', () => co(CoTest.waitForDelay));
  it('should wait for delay via callback', () => co(CoTest.waitForDelayCallback));
  it('should wait for delay until halt', () => co(CoTest.waitForDelayHalt));
  it('should halt waiting for rest array items', () => co(CoTest.waitForArrayHalt));
  it('should halt waiting for rest object items', () => co(CoTest.waitForObjectHalt));
  it('wait for iterator should be slower than fast wait for iterator', () => co(CoTest.iterDelegationMustBeFaster));
});
