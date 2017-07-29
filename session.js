const assert = require('assert');
const { Identity } = require('./identity');
const debug = require('debug')('swarm:session');
const { EventEmitter } = require('events');

/**
 *
 * Mode e,p
 */
class Session extends EventEmitter {
  constructor ({ swarm, url, socket, initiate = false }) {
    super();

    assert(swarm, 'Session needs swarm');
    assert(socket, 'Session needs socket as stream');
    assert(url, 'Session needs source url');

    this.swarm = swarm;
    this.url = url;
    this.peerIdentity = null;
    this.initiate = initiate;
    this.socket = socket;

    socket.on('data', this._onSocketData.bind(this));
    socket.on('end', this._onSocketEnd.bind(this));
  }

  get handshaked () {
    return Boolean(this.peerIdentity);
  }

  _onSocketData (buf) {
    let message = buf.toString();
    let [ from, app, command, mode, payload ] = message.split(':');
    if (mode === 'e') {
      let [ enc, sig ] = payload.split('.').map(chunk => Buffer.from(chunk, 'base64'));
      let verified = this.peerIdentity.verify(enc, sig);
      if (!verified) {
        debug('unverified encrypted message arrived');
        return;
      }

      payload = JSON.parse(this.swarm.identity.decrypt(enc, 'utf8'));

      this.swarm.emit('message', { from, app, command, payload });
    } else {
      this.emit('plain', { from, app, command, payload });
    }
  }

  _onSocketEnd () {
    this.peerIdentity = null;
    this.socket = null;
  }

  end () {
    debug('Ending socket ...');
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
  async handshake () {
    debug('Initiate handshake and advertise');

    this.writeRaw({
      command: 'h',
      mode: 'p',
      payload: this.wrapEnvelope(this.swarm.advertisement),
    });

    if (this.peerIdentity) {
      return;
    }

    let result = await new Promise((resolve, reject) => {
      this.once('plain', ({ version, from, app, command, payload }) => {
        if (app === '' && command === 'h') {
          let advertisement = payload = this.unwrapEnvelope(payload);
          let { publicKey, address } = advertisement;
          this.peerIdentity = new Identity(publicKey);
          if (this.peerIdentity.address !== address) {
            console.error('Session is not coming from valid address');
            return;
          }
          debug('Handshake complete and session established');
          resolve(advertisement);
        }
      });
    });
    return result;
  }

  unwrapEnvelope (payload) {
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
  }

  wrapEnvelope (payload) {
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  writeRaw ({ mode = 'e', app = '', command, payload }) {
    let message = `${this.swarm.identity.address}:${app}:${command}:${mode}:${payload}\n`;
    this.socket.write(message);
  }

  write ({ app = '', command, payload }) {
    payload = JSON.stringify(payload);

    let mode = 'e';
    let enc = this.peerIdentity.encrypt(payload);
    let sig = this.swarm.identity.sign(enc);

    payload = `${enc.toString('base64')}.${sig.toString('base64')}`;
    this.writeRaw({ app, command, mode, payload });
  }
}

module.exports = { Session };
