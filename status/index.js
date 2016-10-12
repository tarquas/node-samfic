const Status = require('..').get(module);

const fs = require('fs');
const http = require('http');
const child = require('child_process');
const express = require('express');

const fsCall = fs [callbacks]('readFile');

Status.port = process.env.VCAP_PORT || process.env.PORT || 3000;
Status.app = express();

Status.initializer = function* initializer() {
  if (!this.server) this.server = new http.Server(this.app);
  if (!Status.indexHtml) Status.indexHtml = yield fsCall.readFile(`${__dirname}/index.html`);
  if (!Status.waitHtml) Status.waitHtml = yield fsCall.readFile(`${__dirname}/wait.html`);
};

Status.finalizer = function* finalizer() {
  if (this.server) {
    this.server.close();
    this.server = null;
  }
};

Status.fileExists = function* fileExists(name) {
  return yield new Promise(ok => fs.exists(name, ok));
};

Status.npmRunScript = function* npmRunScript(script) {
  yield new Promise((ok) => {
    child.exec(`npm run-script ${script}`, {cwd: `${__dirname}/..`}, ok);
  });
};

Status.stay = true;

Status.index = (req, res) => res.end(Status.done ? Status.indexHtml : Status.waitHtml);

Status.main = function* main() {
  const app = Status.app;
  app.get('/', Status.index);
  app.use('/test-report', express.static(`${__dirname}/../test-report`));
  app.use('/lcov-report', express.static(`${__dirname}/../coverage/lcov-report`));
  yield Status.server [callbacks]('listen').listen(Status.port);

  yield Status.npmRunScript('test-report-coverage');
  Status.done = true;
};
