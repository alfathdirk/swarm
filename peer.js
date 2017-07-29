const assert = require('assert');
const debug = require('debug')('swarm:peer');

class Peer {
  constructor ({ urls = [], session }) {
    this.address = '';
    this.urls = urls;
    this.apps = [];
    this.session = session;
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
    this.urls = advertisement.urls;
    this.apps = advertisement.apps;
  }

  send (data) {
    return this.session.write(data);
  }

  dump () {
    let { urls, identity, apps } = this;
    return {
      identity,
      urls,
      apps,
    };
  }
}

module.exports = { Peer };
