const assert = require('assert');
const { Identity } = require('./identity');
const debug = require('./helpers/debug');
const { EventEmitter } = require('events');

class Session extends EventEmitter {
  constructor ({ url, socket, initiate = false }) {
    super();

    assert(socket, 'Session needs socket as stream');
    assert(url, 'Session needs source url');

    this.url = url;
    this.identity = null;
    this.peerIdentity = null;
    this.initiate = initiate;
    this.socket = socket;

    socket.on('data', buf => {
      let [ v, m, p ] = buf.toString().split(':');
      this.emit('raw', { v, m, p });
    });

    socket.on('end', () => {
      this.peerIdentity = null;
      socket = null;
    });
  }

  get handshaked () {
    return Boolean(this.peerIdentity);
  }

  end () {
    debug('Session', 'ending...');
    if (!this.socket) {
      return;
    }

    this.socket.end();
  }

  /**
   * v = version
   * m = mode - h = handshake, d = data
   * p = payload base64
   */
  async handshake (advertisement) {
    debug('Session', 'send handshake advertise');

    // FIXME: change handshaking payload to base64(json(advertisement))
    let { identity, urls = [], apps = [] } = advertisement;
    this.identity = identity;
    console.log('>>>>', { identity, urls, apps });

    this.rawWrite({
      v: 1,
      m: 'h',
      p: `${this.identity.address}.${Buffer.from(this.identity.publicKey).toString('base64')}`,
    });

    if (this.peerIdentity) {
      return;
    }

    await new Promise((resolve, reject) => {
      this.once('raw', ({ v, m, p }) => {
        if (m === 'h') {
          let [ address, pub ] = p.split('.');
          pub = Buffer.from(pub, 'base64').toString('utf8');
          this.peerIdentity = new Identity(pub, address);
          resolve();
        }
      });
    });
  }

  rawWrite ({v, m, p}) {
    this.socket.write(v + ':' + m + ':' + p + '\n');
  }
}

module.exports = { Session };
