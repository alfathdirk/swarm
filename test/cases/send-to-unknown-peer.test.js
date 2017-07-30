const assert = require('assert');
const sinon = require('sinon');
const { Swarm } = require('../../swarm');
const debug = require('debug')('swarm:test:case:tcp-only');
const Tcp = require('../../channel/tcp');
const PeerLookup = require('../../app/peer-lookup');

describe('Case: send to unknown peer', () => {
  let swarms;

  function init () {
    swarms = [];
    swarms.push(createSwarm({ port: 12121 }));
    swarms.push(createSwarm({ port: 12122, peer: 'tcp://localhost:12121' }));
    swarms.push(createSwarm({ port: 12123, peer: 'tcp://localhost:12121' }));
    swarms.push(createSwarm({ port: 12124, peer: 'tcp://localhost:12122' }));
    swarms.push(createSwarm({ port: 12125, peer: 'tcp://localhost:12123' }));
  }

  async function exit () {
    await Promise.all(swarms.map(async swarm => {
      try { await swarm.stop(); } catch (err) {}
    }));
  }

  function createSwarm ({ port, peer }) {
    let swarm = new Swarm();
    let channel = new Tcp({ port });
    swarm.addChannel(channel);

    if (peer) {
      swarm.add(peer);
    }

    let app = new PeerLookup();
    swarm.addApp(app);

    return swarm;
  }

  beforeEach(() => {
    process.on('unhandledRejection', err => console.error('unhandledRejection', err));
  });

  afterEach(async () => {
    await exit();
    process.removeAllListeners('unhandledRejection');
  });

  it('connect to boot peer', async () => {
    await init();

    await Promise.all(swarms.map(swarm => swarm.start()));

    await new Promise(async (resolve, reject) => {
      try {
        swarms[4].on('message', msg => {
          debug('arrived', msg);
          resolve();
        });

        let msg = { address: swarms[4].address, app: 'foo', command: 'bar', payload: 'baz' };
        debug('send', msg);
        await swarms[1].send(msg);
      } catch (err) {
        reject(err);
      }
    });

    await exit();
  }).timeout(10000);
});
