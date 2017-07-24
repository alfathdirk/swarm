const { Session } = require('./session');
const debug = require('./helpers/debug');

class Peer {
  constructor ({ channels = [], urls = [] } = {}) {
    this.urls = urls;
    this.channels = channels;
    this.session = null;
    // TODO: revisit apps
    this.apps = [];
  }

  get connected () {
    return Boolean(this.session && this.session.handshaked);
  }

  get initiate () {
    return Boolean(this.session && this.session.initiate);
  }

  get identity () {
    if (!this.connected) {
      return;
    }
    return this.session.identity;
  }

  async connect (advertisement, session) {
    session = session || (await this.dial());
    await session.handshake(advertisement);
    this.session = session;
  }

  async disconnect () {
    await this.hangup();
  }

  async dial () {
    for (let url of this.urls) {
      let proto = url.split(':').shift();
      let channel = this.channels[proto];
      if (channel) {
        try {
          let socket = await channel.connect(url);
          return new Session({ url, socket, initiate: true });
        } catch (err) {
          console.error(err);
          console.error(`Channel connect error url[${url}] message[${err.message}]`);
        }
      }
    }

    throw new Error('Dial error');
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
