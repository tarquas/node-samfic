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
  yield new Promise((ok, nok) => {
    child.exec(`npm run-script ${script}`, (err, stdout, stderr) => {
      if (err) {
        console.log(stdout);
        console.log(stderr);
        nok(err);
      } else ok(stdout);
    });
  });
};

Status.stay = true;

Status.main = function* main() {
  const testReportDir = `${__dirname}/../test-report`;
  const lcovReportDir = `${__dirname}/../coverage/lcov-report`;
  if (!(yield* Status.fileExists(testReportDir))) yield Status.npmRunScript('test-report');
  if (!(yield* Status.fileExists(lcovReportDir))) yield Status.npmRunScript('coverage');
  const app = Status.app;
  app.get('/', (req, res) => res.end(Status.indexHtml));
  app.use('/test-report', express.static(testReportDir));
  app.use('/lcov-report', express.static(lcovReportDir));
  yield Status.server [callbacks]('listen').listen(Status.port);
};
