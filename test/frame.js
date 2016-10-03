const FrameTest = require('..').get(module);

if (!FrameTest) return;

const chai = require('chai');

FrameTest.marker = 'super';

FrameTest.immediateInit = false;
FrameTest.delayedInit = false;
FrameTest.immediateMain = false;
FrameTest.delayedMain = false;
FrameTest.immediateFinish = false;
FrameTest.delayedFinish = false;

FrameTest.initializer = function* initializer() {
  if (!Object.hasOwnProperty.call(this, 'personalInit')) this.personalInit = this.marker;
  if (this.immediateInit) return;
  this.immediateInit = true;
  yield delay(1 / 50);
  this.delayedInit = true;
};

FrameTest.finalizer = function* finalizer() {
  if (this.immediateFinish) return false;
  this.immediateFinish = true;
  yield delay(1 / 50);
  this.delayedFinish = true;
  return true;
};

FrameTest.testInit = function* testInit() {
  yield this.ready;
  chai.expect(this.immediateInit).to.equal(true);
  chai.expect(this.delayedInit).to.equal(true);
  chai.expect(this.personalInit).to.equal('super');
};

FrameTest.Submodule = FrameTest.get();
FrameTest.Submodule.marker = 'sub';

FrameTest.Submodule.initializer = function* initializer() {
  if (this.subImmediateInit) return;
  this.subImmediateInit = true;
  yield delay(1 / 50);
  this.subDelayedInit = true;
};

FrameTest.Submodule.finalizer = function* finalizer() {
  if (this.subImmediateFinish) return false;
  this.subImmediateFinish = true;
  yield delay(1 / 50);
  this.subDelayedFinish = true;
  return true;
};

FrameTest.Submodule.testInit = function* testInit() {
  yield this.ready;
  yield* this.super.testInit();
  chai.expect(this.subImmediateInit).to.equal(true);
  chai.expect(this.subDelayedInit).to.equal(true);
  chai.expect(this.personalInit).to.equal('sub');
};

FrameTest.testShutdown = function* testShutdown() {
  yield FrameTest.ready;
  chai.expect(yield* FrameTest.shutdown()).to.equal(true);
  chai.expect(FrameTest.immediateFinish).to.equal(true);
  chai.expect(FrameTest.delayedFinish).to.equal(true);
  chai.expect(FrameTest.Submodule.immediateFinish).to.equal(true);
  chai.expect(FrameTest.Submodule.delayedFinish).to.equal(true);
  chai.expect(FrameTest.Submodule.subImmediateFinish).to.equal(true);
  chai.expect(FrameTest.Submodule.subDelayedFinish).to.equal(true);
  chai.expect(yield* FrameTest.shutdown()).to.equal(false);
  chai.expect(FrameTest.zombie).to.equal(true);
};

describe('test frame', function testFrame() {
  this.timeout(10000);
  it('should init', () => co(FrameTest.testInit()));
  it('should init submodule', () => co(FrameTest.Submodule.testInit()));
  it('should shutdown', () => co(FrameTest.testShutdown()));
});
