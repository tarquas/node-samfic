const FuncTest = require('..').get(module);

if (!FuncTest) return;

const chai = require('chai');

FuncTest.testThen = function testThen() {
  let got;
  ({a: 1}) [then](obj => (got = obj));
  chai.expect(got.a).to.equal(1);
};

FuncTest.testFail = function testFail() {
  let got;
  ({a: 1}) [then](obj => global.someUndef(obj)) [fail](err => (got = err));
  chai.expect(got.name).to.equal('TypeError');
};

describe('test func', function testFunc() {
  this.timeout(100);
  it('should then', FuncTest.testThen);
  it('should fail', FuncTest.testFail);
  it('should range', () => chai.expect((5)[range](10)).to.deep.equal([5, 6, 7, 8, 9]));
  it('should keys', () => chai.expect(({a: 1, b: 2}) [keys]()).to.deep.equal(['a', 'b']));
  it('should array keys', () => chai.expect(([1, undefined, 2]) [keys]()).to.deep.equal([0, 1, 2]));
  it('should values', () => chai.expect(({a: 1, b: 2}) [values]()).to.deep.equal([1, 2]));
  it('should array values', () => chai.expect(([1, undefined, 2]) [values]()).to.deep.equal([1, undefined, 2]));
  it('should map empty', () => chai.expect(([1, undefined, 2]) [map]()).to.deep.equal([1, undefined, 2]));
  it('should map by', () => chai.expect(([1, 2]) [map](x => x + 1)).to.deep.equal([2, 3]));
  it('should map fill', () => chai.expect(([1, 2]) [map](5)).to.deep.equal([5, 5]));
  it('should map map', () => chai.expect(([1, 2]) [map]({1: 6, 2: 3})).to.deep.equal([6, 3]));
  it('should map object', () => chai.expect(({5: 1, 8: 2}) [map]({1: 6, 2: 3})).to.deep.equal([6, 3]));
  it('should map array', () => chai.expect(([1, 2]) [map]([4, 5, 6, 7])).to.deep.equal([5, 6]));
  it('should mapKeys equi', () => chai.expect(([1, undefined, 2]) [mapKeys]()).to.deep.equal({1: 1, 2: 2, undefined: undefined})); // eslint-disable-line
  it('should mapKeys by', () => chai.expect(([1, 2]) [mapKeys](x => x + 1)).to.deep.equal({2: 1, 3: 2}));
  it('should mapKeys first', () => chai.expect(([1, 2]) [mapKeys](5)).to.deep.equal({5: 1}));
  it('should mapKeys map', () => chai.expect(([1, undefined, 2]) [mapKeys]({0: 'a', 2: 'b'})).to.deep.equal({a: 1, b: 2, undefined: undefined})); // eslint-disable-line
  it('should mapKeys object', () => chai.expect(({5: 1, 8: 2}) [mapKeys]({5: 6, 8: 3})).to.deep.equal({6: 1, 3: 2}));
  it('should mapKeys array', () => chai.expect(([1, 2]) [mapKeys]([4, 5, 6, 7])).to.deep.equal({4: 1, 5: 2}));
  it('should mapValues equi', () => chai.expect(([1, undefined, 2]) [mapValues]()).to.deep.equal({0: 0, 1: 1, 2: 2}));
  it('should mapValues by', () => chai.expect(([1, 2]) [mapValues](x => x + 1)).to.deep.equal({0: 2, 1: 3}));
  it('should mapValues fill', () => chai.expect(([1, 2]) [mapValues](5)).to.deep.equal({0: 5, 1: 5}));
  it('should mapValues map', () => chai.expect(([1, undefined, 2]) [mapValues]({1: 'a', 2: 'b'})).to.deep.equal({1: 'a', 2: 'b'}));
  it('should mapValues object', () => chai.expect(({5: 1, 8: 2}) [mapValues]({1: 6, 2: 3})).to.deep.equal({5: 6, 8: 3}));
  it('should mapValues array', () => chai.expect(([1, 2]) [mapValues]([4, 5, 6, 7])).to.deep.equal({1: 4, 2: 5}));
  it('should fromPairs', () => chai.expect(([['a', 1], ['b', '2']]) [fromPairs]()).to.deep.equal({a: 1, b: '2'}));
  it('should pick array', () => chai.expect(({a: 1, b: 2, c: 3}) [pick](['a', 'b'])).to.deep.equal({a: 1, b: 2}));
  it('should pick object', () => chai.expect(({a: 1, b: 2, c: 3}) [pick]({a: true, b: undefined}, {})).to.deep.equal({a: 1, b: 2}));
  it('should pick by', () => chai.expect(({a: 1, b: 2, c: 3, d: 0}) [pick](v => v > 1, 'd')).to.deep.equal({b: 2, c: 3, d: 0}));
  it('should omit array', () => chai.expect(({a: 1, b: 2, c: 3}) [omit](['a', 'b'])).to.deep.equal({c: 3}));
  it('should omit object', () => chai.expect(({a: 1, b: 2, c: 3}) [omit]({a: true, b: undefined}, {})).to.deep.equal({c: 3}));
  it('should omit by', () => chai.expect(({a: 1, b: 2, c: 3, d: 0}) [omit](v => v > 1, 'd')).to.deep.equal({a: 1}));
  it('should defaults', () => chai.expect(({a: 1, b: 2}) [defaults]({b: 3, c: 4}, {d: 5})).to.deep.equal({a: 1, b: 2, c: 4, d: 5}));
  it('should extend', () => chai.expect(({a: 1, b: 2}) [extend]({b: 3, c: 4}, {d: 5})).to.deep.equal({a: 1, b: 3, c: 4, d: 5}));
  it('should groupBy key', () => chai.expect(([{a: 1, b: 2}, {a: 1, b: 3}, {a: 2, b: 3}]) [groupBy]('a')).to.deep.equal({1: [{a: 1, b: 2}, {a: 1, b: 3}], 2: [{a: 2, b: 3}]}));
  it('should groupBy by', () => chai.expect(([{a: 1, b: 2}, {a: 1, b: 3}, {a: 2, b: 3}]) [groupBy](item => item.b)).to.deep.equal({2: [{a: 1, b: 2}], 3: [{a: 1, b: 3}, {a: 2, b: 3}]}));
  it('should extendDeep', () => chai.expect(({a: 1, b: {a: 2, b: 3}}) [extendDeep]({b: {b: 4, c: 5}, c: 4}, {d: 5})).to.deep.equal({a: 1, b: {a: 2, b: 4, c: 5}, c: 4, d: 5}));
  it('should flatten', () => chai.expect(([[1, 2], [3, [4, 5]], 6]) [flatten]()).to.deep.equal([1, 2, 3, [4, 5], 6]));
  it('should flattenDeep', () => chai.expect(([[1, 2], [3, [4, 5]], 6]) [flattenDeep]()).to.deep.equal([1, 2, 3, 4, 5, 6]));
  it('should filter', () => chai.expect(([1, 2, 3, 4, 5, 6]) [filter](x => x % 2)).to.deep.equal([1, 3, 5]));
});
