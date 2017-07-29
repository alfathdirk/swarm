const debug = require('debug')('swarm:discovery:peer-lookup');
const { Discovery } = require('../../discovery');

let id = 0;

class PeerLookupDiscovery extends Discovery {
  constructor (app) {
    super();

    this.id = id++;
    this.app = app;
  }

  lookup (address) {
    return new Promise(async resolve => {
      let definition = await this.app.doLookup(address);
      if (definition) {
        resolve(definition);
      }
    });
  }
}

module.exports = PeerLookupDiscovery;
