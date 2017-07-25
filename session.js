const assert = require('assert');
const { Identity } = require('./identity');
const debug = require('./helpers/debug');
const { EventEmitter } = require('events');

/**
 *
 * Mode e,p
 */
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
      let message = buf.toString();
      let [ version, from, app, command, mode, payload ] = message.split(':');
      if (mode === 'e') {
        let [ enc, sig ] = payload.split('.').map(chunk => Buffer.from(chunk, 'base64'));
        let verified = this.peerIdentity.verify(enc, sig);
        if (!verified) {
          debug('Session', 'unverified encrypted message arrived');
          return;
        }

        payload = JSON.parse(this.identity.decrypt(enc, 'utf8'));

        this.emit('message', { version, from, app, command, payload });
      } else {
        this.emit('plain', { version, from, app, command, payload });
      }
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
  async handshake (identity, advertisement) {
    debug('Session', 'send handshake advertise');

    this.identity = identity;
    let { address, publicKey } = identity;

    this.writeRaw({
      command: 'h',
      mode: 'p',
      payload: this.wrapEnvelope(Object.assign({ identity: { address, publicKey } }, advertisement)),
    });

    if (this.peerIdentity) {
      return;
    }

    let result = await new Promise((resolve, reject) => {
      this.once('plain', ({ version, from, app, command, payload }) => {
        if (app === '' && command === 'h') {
          payload = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
          let { publicKey, address } = payload.identity;
          this.peerIdentity = new Identity(publicKey, address);
          resolve(payload);
        }
      });
    });
    return result;
  }

  wrapEnvelope (payload) {
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  writeRaw ({version = 1, mode = 'e', app = '', command, payload}) {
    console.log(`${version}:${this.identity.address}:${app}:${command}:${mode}:${payload}\n`);
    this.socket.write(`${version}:${this.identity.address}:${app}:${command}:${mode}:${payload}\n`);
  }

  write ({ version = 1, app = '', command, payload }) {
    payload = JSON.stringify(payload);

    let mode = 'e';
    let enc = this.peerIdentity.encrypt(payload);
    let sig = this.identity.sign(enc);

    payload = `${enc.toString('base64')}.${sig.toString('base64')}`;
    this.writeRaw({ version, app, command, mode, payload });
  }
}

module.exports = { Session };
