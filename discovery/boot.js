const { Discovery } = require('../discovery');

class Boot extends Discovery {
  constructor ({ bootPeers }) {
    super();

    this.bootPeers = bootPeers;
  }

  discover () {
    return this.bootPeers.map(peer => ({ urls: [ peer ] }));
  }
}

module.exports = Boot;
