const assert = require('assert');
const sinon = require('sinon');
const { Swarm } = require('../../swarm');
const debug = require('debug')('swarm:test:case:tcp-only');
const Tcp = require('../../channel/tcp');

describe('Case: tcp only', () => {
  let swarm1;
  let swarm2;

  function init () {
    swarm1 = createSwarm({ port: 12121 });
    swarm2 = createSwarm({ port: 12122, peer: 'tcp://localhost:12121' });
  }

  async function exit () {
    let result = [];
    try { result.push(swarm1.stop()); } catch (err) {}
    try { result.push(swarm2.stop()); } catch (err) {}
    await Promise.all(result);
    swarm1 = null;
    swarm2 = null;
  }

  function createSwarm ({ port, peer }) {
    let swarm = new Swarm();
    let channel = new Tcp({ port });
    swarm.addChannel(channel);

    if (peer) {
      swarm.add(peer);
    }
    return swarm;
  }

  afterEach(async () => {
    await exit();
  });

  it('connect to boot peer', async () => {
    await init();

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
  });

  it('send to other peer', async () => {
    await init();

    await swarm1.start();
    await swarm2.start();

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

      swarm1.send(Object.assign({ address: swarm2.address }, outboundMessage));
    });
  });
});
