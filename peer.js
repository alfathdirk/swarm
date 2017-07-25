const debug = require('./helpers/debug');

class Peer {
  constructor ({ urls = [] } = {}) {
    this.urls = urls;
    this.session = null;
    this.apps = [];
  }

  get connected () {
    return Boolean(this.session && this.session.handshaked);
  }

  get initiate () {
    return Boolean(this.session && this.session.initiate);
  }

  send (data) {
    return this.session.write(data);
  }

  async hangup () {
    debug('Peer', 'Hanging up');
    if (!this.session) {
      return;
    }

    await this.session.end();
    this.session = null;
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
