const assert = require('assert');
const debug = require('debug')('swarm:peer');

class Peer {
  constructor ({ urls = [], session }) {
    this.address = '';
    this.publicKey = '';
    this.urls = urls;
    this.apps = [];
    this.session = session;
    // Object.defineProperty(this, 'session', {
    //   enumerable: false,
    //   writable: true,
    //   configurable: true,
    //   value: session,
    // });
  }

  get connected () {
    return Boolean(this.session && this.session.handshaked);
  }

  get initiate () {
    return Boolean(this.session && this.session.initiate);
  }

  async handshake () {
    let advertisement = await this.session.handshake();
    this.address = advertisement.address;
    this.publicKey = advertisement.publicKey;
    this.urls = advertisement.urls;
    this.apps = advertisement.apps;
  }

  send ({ app, command, payload }) {
    return this.session.write({ app, command, payload });
  }

  dump () {
    let { address, publicKey, urls, apps } = this;
    return {
      address,
      publicKey,
      urls,
      apps,
    };
  }
}

module.exports = { Peer };
