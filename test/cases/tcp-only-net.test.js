const assert = require('assert');
const sinon = require('sinon');
const { Swarm } = require('../../swarm');

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

    console.log(swarm1.peers[0].dump());
  });
});
