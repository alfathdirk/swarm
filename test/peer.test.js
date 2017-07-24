const assert = require('assert');
const sinon = require('sinon');
const { Peer } = require('../peer');
// const { Channel } = require('../channel');

describe('Peer', () => {
  // describe('#connect()', () => {
  //   it('try dialing supported url and done', async () => {
  //     let urls = [ 'baz:1', 'foo:1', 'bar:1' ];
  //     let session = { handshake () {} };
  //     let sessionSpy = sinon.spy(session, 'handshake');
  //     let fooChannel = { kind: 'foo', connect () { return session; } };
  //     let barChannel = { kind: 'bar', connect () { return session; } };
  //     let fooConnectSpy = sinon.spy(fooChannel, 'connect');
  //     let barConnectSpy = sinon.spy(barChannel, 'connect');
  //     let channels = [ fooChannel, barChannel ];

  //     let peer = new Peer({ urls, channels });
  //     await peer.connect();

  //     assert(fooConnectSpy.called, 'foo#connect() called');
  //     assert(!barConnectSpy.called, 'bar#connect() not called');
  //     assert(sessionSpy.called, 'session#handshake() called');
  //     assert(peer.connected, 'peer#connected');
  //     assert(peer.initiate, 'peer#initiated');

  //     fooConnectSpy.restore();
  //     barConnectSpy.restore();
  //     sessionSpy.restore();
  //   });
  // });

  // describe('#disconnect()', () => {
  //   it('disconnect and remove session', () => {
  //     let peer = new Peer();
  //     peer.session = { disconnect () {} };
  //     let spy = sinon.spy(peer.session, 'disconnect');
  //     peer.disconnect();
  //     assert(spy.called);
  //     assert(!peer.session);
  //   });
  // });

  // describe('#getSupportedChannel()', () => {
  //   it('return supported channel', () => {
  //     let url = 'foo:1';
  //     let fooChannel = { kind: 'foo' };
  //     let barChannel = { kind: 'bar' };
  //     let channels = [ barChannel, fooChannel ];

  //     let peer = new Peer({ channels });
  //     let channel = peer.getSupportedChannel(url);

  //     assert.equal(channel, fooChannel);
  //   });
  // });
});
