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

CoTest.waitForDelay = function* waitForDelay() {
  const startAt = process.uptime();
  yield delay(1 / 10);
  const duration = Math.round((process.uptime() - startAt) * 10);
  chai.expect(duration).to.equal(1);
  return duration;
};

CoTest.callbacks = {
  delay: function(sec, callback) {
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

  co(function*() {
    yield delay(1 / 10);
    delayed[halt]('halt test');
  });

  try {
    yield delayed;
  } catch (err) {
    chai.expect(err).to.equal('halt test');
  }

  const duration = Math.round((process.uptime() - startAt) * 10);
  chai.expect(duration).to.equal(1);
  return duration;
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
  it('should wait for falsy value', () => co(CoTest.waitForFalsyValue));
  it('should wait for delay', () => co(CoTest.waitForDelay));
  it('should wait for delay via callback', () => co(CoTest.waitForDelayCallback));
  it('should wait for delay until halt', () => co(CoTest.waitForDelayHalt));
  it('wait for iterator should be slower than fast wait for iterator', () => co(CoTest.iterDelegationMustBeFaster));
});
