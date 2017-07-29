const assert = require('assert');
const { Channel } = require('../channel');
const { Discovery } = require('../discovery');
const { App } = require('../app');

function channel (channel) {
  assert(channel instanceof Channel, 'Channel must be instance of Channel');
  assert('proto' in channel, 'Channel must define proto');
  assert('up' in channel, 'Channel must implement up');
  assert('down' in channel, 'Channel must implement down');
  assert('connect' in channel, 'Channel must implement connect');
  assert('formatUrl' in channel, 'Channel must implement formatUrl');
}

function app (app) {
  assert(app instanceof App, 'App must be instance of App');
  assert('name' in app, 'App must define name');
  assert('up' in app, 'App must implement up');
  assert('down' in app, 'App must implement down');
  assert('onMessage' in app, 'App must implement onMessage');
}

function discovery (method) {
  assert(method instanceof Discovery, 'Discovery must be instance of Discovery');
  assert('lookup' in method, 'Discovery must implement lookup');
}

module.exports = { channel, app, discovery };
