const assert = require('assert');
const sinon = require('sinon');
const { Swarm } = require('../../swarm');
const debug = require('debug')('swarm:test:case:tcp-only');

describe.only('Case: tcp only net', () => {
  let swarm1;
  let swarm2;

  beforeEach(() => {
    swarm1 = new Swarm({ channels: [ { kind: 'tcp', port: 12121 } ] });
    swarm2 = new Swarm({
      channels: [ { kind: 'tcp', port: 12122 } ],
      bootPeers: [ 'tcp://localhost:12121' ],
    });
  });

  afterEach(async () => {
    let result = [];
    try { result.push(swarm1.stop()); } catch (err) {}
    try { result.push(swarm2.stop()); } catch (err) {}
    await Promise.all(result);
  });

  it('connect to boot peer', async () => {
    let spy1 = sinon.spy();
    let spy2 = sinon.spy();

    swarm1.on('connect', spy1);
    swarm2.on('connect', spy2);

    await swarm1.start();
    await swarm2.start();

    assert(spy1.called);
    assert(spy2.called);
    assert.equal(swarm1.peers.length, 1);
    assert.equal(swarm2.peers.length, 1);

    // console.log(swarm1.peers);
    // console.log(swarm2.peers);

    await new Promise((resolve, reject) => {
      let outboundMessage = {
        app: 'foo',
        command: 'bar',
        payload: 'anu gemes',
      };

      swarm2.on('message', message => {
        try {
          let { app, command, payload } = message;
          assert.deepEqual({ app, command, payload }, outboundMessage);

          resolve();
        } catch (err) {
          reject(err);
        }
      });

      // debug(swarm2.peers)

      swarm1.send(swarm2.address, outboundMessage);
    });
  });
});
