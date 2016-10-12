const Frame = module.exports = require('./src/frame');
const Co = require('./src/co');
const Funnel = require('./src/funnel');
const symbol = require('./src/symbol');

Frame.Co = Co;
Frame.Funnel = Funnel;
Frame.symbol = symbol;

if (require.main === module) {
  const Status = require('./status'); // eslint-disable-line
  Status.forceMain = true;
}
