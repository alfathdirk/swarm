const assert = require('assert');
const sinon = require('sinon');
const { Swarm } = require('../../swarm');
const debug = require('debug')('swarm:test:case:tcp-only');
const Tcp = require('../../channel/adapters/tcp');
const Boot = require('../../discovery/adapters/boot');

process.on('unhandledRejection', (err, p) => {
  console.error('An unhandledRejection occurred');
  // console.error(`Rejected Promise: ${p}`);
  console.error(err);
});

describe.only('Case: send to unknown peer', () => {
  let swarms;

  function init () {
    swarms = [];
    swarms.push(createSwarm({ port: 12121 }));
    swarms.push(createSwarm({ port: 12122, peer: 'tcp://localhost:12121' }));
    // swarms.push(createSwarm({ port: 12123, peer: 'tcp://localhost:12121' }));
    // swarms.push(createSwarm({ port: 12124, peer: 'tcp://localhost:12122' }));
    // swarms.push(createSwarm({ port: 12125, peer: 'tcp://localhost:12123' }));
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
      let discovery = new Boot({ bootPeers: [ peer ] });
      swarm.discovery.add(discovery);
    }
    return swarm;
  }

  afterEach(async () => {
    await exit();
  });

  it('connect to boot peer', async () => {
    await init();

    await Promise.all(swarms.map(swarm => swarm.start()));

    await new Promise(async (resolve, reject) => {
      try {
        swarms[0].once('message', msg => {
          console.log('>>>', msg);
          resolve();
        });

        await swarms[1].send(swarms[0].address, { command: 'foo', payload: 'bar' });
      } catch (err) {
        reject(err);
      }
    });

    await exit();
  });
});
