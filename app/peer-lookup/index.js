const debug = require('debug')('swarm:app:peer-lookup');
const Discovery = require('./discovery');
const { App } = require('../../app');

class PeerLookup extends App {
  constructor () {
    super();

    this.cache = {};
    this.discovery = new Discovery(this);
  }

  get name () {
    return 'peer-lookup';
  }

  async onMessage ({ address, command, payload }) {
    switch (command) {
      case 'q':
        let query = payload;
        // debug(this.accessor.address, address, 'onMessage:q?', query);
        // see if swarm already have peer with address
        let definition = this.getPeerDefinition(query);
        if (!definition) {
          // debug(this.accessor.address, address, 'onMessage:q next');
          // lookup more to peers
          definition = await this.doLookup(query);
        }

        if (!definition) {
          return;
        }

        // debug(this.accessor.address, address, 'onMessage:q found');
        // found peer
        if (this.cache[query]) {
          this.cache[query].definition = definition;
          this.cache[query].resolve();
        }

        // debug('send answer');
        this.send({ address, command: 'a', payload: definition });
        break;
      case 'a': {
        // debug(this.accessor.address, address, 'onMessage:a');
        let query = payload.address;
        if (this.cache[query]) {
          this.cache[query].definition = payload;
          this.cache[query].resolve();
        }
        break;
      }
    }
  }

  async doLookup (address) {
    if (address in this.cache === false) {
      await new Promise((resolve, reject) => {
        this.cache[address] = { definition: null, resolve, reject };
        this.broadcast({ command: 'q', payload: address });
      });
    }

    return this.cache[address].definition;
  }

  up () {
    debug('peer-lookup up');
    this.addDiscovery(this.discovery);
  }

  down () {
    debug('peer-lookup down');
    this.removeDiscovery(this.discovery);
  }
}

module.exports = PeerLookup;
