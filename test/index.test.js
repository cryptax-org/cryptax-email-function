/**
 * Copyright 2017, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const proxyquire = require(`proxyquire`).noCallThru();
const sinon = require(`sinon`);
const test = require(`ava`);
const tools = require(`@google-cloud/nodejs-repo-tools`);

const method = `POST`;
const key = `sengrid_key`;
const to = `receiver@email.com`;
const from = `sender@email.com`;
const subject = `subject`;
const body = `body`;

function getSample () {
  const config = {
    EVENT_BUCKET: 'event-bucket',
    DATASET: 'datasets',
    TABLE: 'events',
    USERNAME: 'foo',
    PASSWORD: 'bar'
  };
  const request = {};
  const client = {
    API: sinon.stub().returns(Promise.resolve({
      statusCode: 200,
      body: 'success',
      headers: {
        'content-type': 'application/json',
        'content-length': 10
      }
    })),
    emptyRequest: sinon.stub().returns(request)
  };
  const file = { save: sinon.stub().returns(Promise.resolve()) };
  const bucket = { file: sinon.stub().returns(file) };
  const storage = { bucket: sinon.stub().returns(bucket) };
  const job = { promise: sinon.stub().returns(Promise.resolve()) };
  const table = { import: sinon.stub().returns(Promise.resolve([job, {}])) };
  table.get = sinon.stub().returns(Promise.resolve([table]));
  const dataset = { table: sinon.stub().returns(table) };
  dataset.get = sinon.stub().returns(Promise.resolve([dataset]));
  const bigquery = { dataset: sinon.stub().returns(dataset) };
  const BigQueryMock = sinon.stub().returns(bigquery);
  const StorageMock = sinon.stub().returns(storage);
  const sendgrid = sinon.stub().returns(client);
  const uuid = { v4: sinon.stub() };

  return {
    program: proxyquire(`../`, {
      sendgrid: sendgrid,
      '@google-cloud/bigquery': BigQueryMock,
      '@google-cloud/storage': StorageMock,
      './config.json': config,
      'uuid': uuid
    }),
    mocks: {
      sendgrid,
      client,
      request,
      bucket,
      file,
      storage,
      bigquery,
      dataset,
      table,
      config,
      uuid,
      job
    }
  };
}

function getMocks () {
  let req = {
    headers: {},
    query: {},
    body: {},
    get: function (header) {
      return this.headers[header];
    }
  };
  sinon.spy(req, 'get');
  let res = {
    headers: {},
    send: sinon.stub().returnsThis(),
    json: sinon.stub().returnsThis(),
    end: sinon.stub().returnsThis(),
    status: function (statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    set: function (header, value) {
      this.headers[header] = value;
      return this;
    }
  };
  sinon.spy(res, 'status');
  sinon.spy(res, 'set');
  return {
    req: req,
    res: res
  };
}

test.beforeEach(tools.stubConsole);
test.afterEach.always(tools.restoreConsole);

test.serial(`Send fails if not a POST request`, async (t) => {
  const error = new Error(`Only POST requests are accepted`);
  error.code = 405;
  const sample = getSample();
  const mocks = getMocks();

  const err = await t.throws(sample.program.sendgridEmail(mocks.req, mocks.res));
  t.deepEqual(err, error);
  t.is(mocks.res.status.callCount, 1);
  t.deepEqual(mocks.res.status.firstCall.args, [error.code]);
  t.is(mocks.res.send.callCount, 1);
  t.deepEqual(mocks.res.send.firstCall.args, [error]);
  t.is(console.error.callCount, 1);
  t.deepEqual(console.error.firstCall.args, [error]);
});

test.serial(`Send fails without an API key`, async (t) => {
  const error = new Error(`SendGrid API key not provided. Make sure you have a "sg_key" property in your request querystring`);
  error.code = 401;
  const mocks = getMocks();

  mocks.req.method = method;

  const err = await t.throws(getSample().program.sendgridEmail(mocks.req, mocks.res));
  t.deepEqual(err, error);
  t.is(mocks.res.status.callCount, 1);
  t.deepEqual(mocks.res.status.firstCall.args, [error.code]);
  t.is(mocks.res.send.callCount, 1);
  t.deepEqual(mocks.res.send.firstCall.args, [error]);
  t.is(console.error.callCount, 1);
  t.deepEqual(console.error.firstCall.args, [error]);
});

test.serial(`Send fails without a "to"`, async (t) => {
  const error = new Error(`To email address not provided. Make sure you have a "to" property in your request`);
  error.code = 400;
  const mocks = getMocks();

  mocks.req.method = method;
  mocks.req.query.sg_key = key;
  const err = await t.throws(getSample().program.sendgridEmail(mocks.req, mocks.res));
  t.deepEqual(err, error);
  t.is(mocks.res.status.callCount, 1);
  t.deepEqual(mocks.res.status.firstCall.args, [error.code]);
  t.is(mocks.res.send.callCount, 1);
  t.deepEqual(mocks.res.send.firstCall.args, [error]);
  t.is(console.error.callCount, 1);
  t.deepEqual(console.error.firstCall.args, [error]);
});

test.serial(`Send fails without a "from"`, async (t) => {
  const error = new Error(`From email address not provided. Make sure you have a "from" property in your request`);
  error.code = 400;
  const mocks = getMocks();

  mocks.req.method = method;
  mocks.req.query.sg_key = key;
  mocks.req.body.to = to;

  const err = await t.throws(getSample().program.sendgridEmail(mocks.req, mocks.res));
  t.deepEqual(err, error);
  t.is(mocks.res.status.callCount, 1);
  t.deepEqual(mocks.res.status.firstCall.args, [error.code]);
  t.is(mocks.res.send.callCount, 1);
  t.deepEqual(mocks.res.send.firstCall.args, [error]);
  t.is(console.error.callCount, 1);
  t.deepEqual(console.error.firstCall.args, [error]);
});

test.serial(`Send fails without a "subject"`, async (t) => {
  const error = new Error(`Email subject line not provided. Make sure you have a "subject" property in your request`);
  error.code = 400;
  const mocks = getMocks();

  mocks.req.method = method;
  mocks.req.query.sg_key = key;
  mocks.req.body.to = to;
  mocks.req.body.from = from;

  const err = await t.throws(getSample().program.sendgridEmail(mocks.req, mocks.res));
  t.deepEqual(err, error);
  t.is(mocks.res.status.callCount, 1);
  t.deepEqual(mocks.res.status.firstCall.args, [error.code]);
  t.is(mocks.res.send.callCount, 1);
  t.deepEqual(mocks.res.send.firstCall.args, [error]);
  t.is(console.error.callCount, 1);
  t.deepEqual(console.error.firstCall.args, [error]);
});

test.serial(`Send fails without a "body"`, async (t) => {
  const error = new Error(`Email content not provided. Make sure you have a "body" property in your request`);
  error.code = 400;
  const mocks = getMocks();

  mocks.req.method = method;
  mocks.req.query.sg_key = key;
  mocks.req.body.to = to;
  mocks.req.body.from = from;
  mocks.req.body.subject = subject;

  const err = await t.throws(getSample().program.sendgridEmail(mocks.req, mocks.res));
  t.deepEqual(err, error);
  t.is(mocks.res.status.callCount, 1);
  t.deepEqual(mocks.res.status.firstCall.args, [error.code]);
  t.is(mocks.res.send.callCount, 1);
  t.deepEqual(mocks.res.send.firstCall.args, [error]);
  t.is(console.error.callCount, 1);
  t.deepEqual(console.error.firstCall.args, [error]);
});

test.serial(`Handles response error`, async (t) => {
  const mocks = getMocks();
  const sample = getSample();

  mocks.req.method = method;
  mocks.req.query.sg_key = key;
  mocks.req.body.to = to;
  mocks.req.body.from = from;
  mocks.req.body.subject = subject;
  mocks.req.body.body = body;
  sample.mocks.client.API.returns(Promise.resolve({
    statusCode: 500,
    body: `error`
  }));

  await t.throws(sample.program.sendgridEmail(mocks.req, mocks.res));
  t.is(mocks.res.status.callCount, 1);
  t.deepEqual(mocks.res.status.firstCall.args, [500]);
  t.is(mocks.res.send.callCount, 1);
  t.deepEqual(mocks.res.send.firstCall.args[0].message, `error`);
});

test.serial(`Sends the email and successfully responds`, async (t) => {
  const mocks = getMocks();

  mocks.req.method = method;
  mocks.req.query.sg_key = key;
  mocks.req.body.to = to;
  mocks.req.body.from = from;
  mocks.req.body.subject = subject;
  mocks.req.body.body = body;

  await getSample().program.sendgridEmail(mocks.req, mocks.res);
  t.is(mocks.res.status.callCount, 1);
  t.deepEqual(mocks.res.status.firstCall.args, [200]);
  t.is(mocks.res.send.callCount, 1);
  t.deepEqual(mocks.res.send.firstCall.args, [`success`]);
});

test.serial(`Handles empty response body`, async (t) => {
  const sample = getSample();
  const mocks = getMocks();

  mocks.req.method = method;
  mocks.req.query.sg_key = key;
  mocks.req.body.to = to;
  mocks.req.body.from = from;
  mocks.req.body.subject = subject;
  mocks.req.body.body = body;

  sample.mocks.client.API.returns(Promise.resolve({
    statusCode: 200,
    headers: {}
  }));

  await sample.program.sendgridEmail(mocks.req, mocks.res);
  t.is(mocks.res.status.callCount, 1);
  t.deepEqual(mocks.res.status.firstCall.args, [200]);
  t.is(mocks.res.end.callCount, 1);
  t.deepEqual(mocks.res.end.firstCall.args, []);
});
