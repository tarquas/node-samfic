const FunnelTest = module.exports;

const chai = require('chai');

require('../src/funnel');

FunnelTest.delayTest = function* delayTest(sec) {
  yield delay(sec);
  return sec;
};

FunnelTest.getTestArray = () => [
  FunnelTest.delayTest(1 / 100),
  FunnelTest.delayTest(2 / 100),
  FunnelTest.delayTest(3 / 100),
  FunnelTest.delayTest(4 / 100),
  FunnelTest.delayTest(5 / 100),
  FunnelTest.delayTest(6 / 100)
];

FunnelTest.resultsTestArray = [
  1 / 100,
  2 / 100,
  3 / 100,
  4 / 100,
  5 / 100,
  6 / 100
];

FunnelTest.getTestObject = () => ({
  step1: FunnelTest.delayTest(1 / 100),
  step2: FunnelTest.delayTest(2 / 100),
  step3: FunnelTest.delayTest(3 / 100),
  step4: FunnelTest.delayTest(4 / 100),
  step5: FunnelTest.delayTest(5 / 100),
  step6: FunnelTest.delayTest(6 / 100)
});

FunnelTest.resultsTestObject = {
  step1: 1 / 100,
  step2: 2 / 100,
  step3: 3 / 100,
  step4: 4 / 100,
  step5: 5 / 100,
  step6: 6 / 100
};

FunnelTest.allArray = function* allArray() {
  const startAt = process.uptime();
  const results = yield* FunnelTest.getTestArray() [all]();
  const duration = Math.floor((process.uptime() - startAt) * 25) * 4;
  chai.expect(results).to.deep.equal(FunnelTest.resultsTestArray);
  chai.expect(duration).to.equal(4);
  return duration;
};

FunnelTest.allObject = function* allObject() {
  const startAt = process.uptime();
  const results = yield* FunnelTest.getTestObject() [all]();
  const duration = Math.floor((process.uptime() - startAt) * 25) * 4;
  chai.expect(results).to.deep.equal(FunnelTest.resultsTestObject);
  chai.expect(duration).to.equal(4);
  return duration;
};

FunnelTest.tubeArray = function* tubeArray() {
  const startAt = process.uptime();
  const results = yield* FunnelTest.getTestArray() [tube](2);
  const duration = Math.floor((process.uptime() - startAt) * 25) * 4;
  chai.expect(results).to.deep.equal(FunnelTest.resultsTestArray);
  chai.expect(duration).to.equal(12);
  return duration;
};

FunnelTest.tubeObject = function* tubeObject() {
  const startAt = process.uptime();
  const results = yield* FunnelTest.getTestObject() [tube](2);
  const duration = Math.floor((process.uptime() - startAt) * 25) * 4;
  chai.expect(results).to.deep.equal(FunnelTest.resultsTestObject);
  chai.expect(duration).to.equal(12);
  return duration;
};

FunnelTest.batchArray = function* batchArray() {
  const startAt = process.uptime();
  const results = yield* FunnelTest.getTestArray() [batch](3);
  const duration = Math.floor((process.uptime() - startAt) * 25) * 4;
  chai.expect(results).to.deep.equal(FunnelTest.resultsTestArray);
  chai.expect(duration).to.equal(8);
  return duration;
};

FunnelTest.batchObject = function* batchObject() {
  const startAt = process.uptime();
  const results = yield* FunnelTest.getTestObject() [batch](3);
  const duration = Math.floor((process.uptime() - startAt) * 25) * 4;
  chai.expect(results).to.deep.equal(FunnelTest.resultsTestObject);
  chai.expect(duration).to.equal(8);
  return duration;
};

describe('test funnel', function testFunnel() {
  this.timeout(10000);
  it('should wait for all array of iterators', () => co(FunnelTest.allArray()));
  it('should wait for all object of iterators', () => co(FunnelTest.allObject()));
  it('should wait for tube array of iterators', () => co(FunnelTest.tubeArray()));
  it('should wait for tube object of iterators', () => co(FunnelTest.tubeObject()));
  it('should wait for batch array of iterators', () => co(FunnelTest.batchArray()));
  it('should wait for batch object of iterators', () => co(FunnelTest.batchObject()));
});
