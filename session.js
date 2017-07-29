const assert = require('assert');
const { Identity } = require('./identity');
const debug = require('debug')('swarm:session');
const { EventEmitter } = require('events');
const split = require('split');

const TIMEOUT_HANDSHAKE = 10000;
const SYSTEM_APPNAME = '!';

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
    this.chunks = [];

    socket.pipe(split(null, null, { trailing: false })).on('data', this._onSocketData.bind(this));
    socket.on('end', this._onSocketEnd.bind(this));
  }

  get handshaked () {
    return Boolean(this.peerIdentity);
  }

  _onSocketData (chunk) {
    let message = chunk.toString();
    let [ address, app, command, mode, payload ] = message.split(':');
    if (mode === 'e') {
      let [ enc, sig ] = payload.split('.').map(chunk => Buffer.from(chunk, 'base64'));
      let verified = this.peerIdentity.verify(enc, sig);
      if (!verified) {
        debug('Unverified encrypted message arrived');
        return;
      }

      payload = JSON.parse(this.swarm.identity.decrypt(enc, 'utf8'));

      this.swarm.emit('message', { address, app, command, payload });
    } else if (app !== SYSTEM_APPNAME) {
      this.swarm.emit('plain', { address, app, command, payload });
    } else if (command === 'h') {
      this._onHandshake({ address, app, command, payload });
    }
  }

  _onSocketEnd () {
    this.peerIdentity = null;
    this.socket = null;
  }

  end () {
    // debug('Ending socket ...');
    if (!this.socket) {
      return;
    }

    this.socket.end();
  }

  /**
   * mode = p: plain e: encrypted
   */
  async handshake () {
    debug('Initiate handshake and advertise');
    this.writeRaw({
      app: SYSTEM_APPNAME,
      command: 'h',
      mode: 'p',
      payload: this.wrapEnvelope(this.swarm.advertisement),
    });

    if (this.peerIdentity) {
      return;
    }

    let result = await new Promise((resolve, reject) => {
      this._handshakeCallbacks = [ resolve, reject ];

      setTimeout(() => {
        this._handshakeCallbacks = null;
        reject(new Error('Handshake timeout'));
      }, TIMEOUT_HANDSHAKE);
    });

    return result;
  }

  _onHandshake ({ address, app, command, payload }) {
    if (!this._handshakeCallbacks) {
      return;
    }

    let [ resolve, reject ] = this._handshakeCallbacks;
    this._handshakeCallbacks = null;

    try {
      let advertisement = payload = this.unwrapEnvelope(payload);
      let { publicKey, address } = advertisement;
      this.peerIdentity = new Identity(publicKey);
      if (this.peerIdentity.address !== address) {
        console.error('Session is not coming from valid address');
        return;
      }
      resolve(advertisement);
    } catch (err) {
      console.error('handshake error', err);
      reject(err);
    }
  }

  unwrapEnvelope (payload) {
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
  }

  wrapEnvelope (payload) {
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  writeRaw ({ mode = 'e', app, command, payload = '' }) {
    assert(app, 'Destination app must be specified');
    assert(app, 'Destination command must be specified');
    let message = `${this.swarm.identity.address}:${app}:${command}:${mode}:${payload}\n`;
    // debug('Sending', message);
    this.socket.write(message);
  }

  write ({ app, command, payload = '' }) {
    let mode = 'e';

    if (payload) {
      payload = JSON.stringify(payload);
      let enc = this.peerIdentity.encrypt(payload);
      let sig = this.swarm.identity.sign(enc);
      payload = `${enc.toString('base64')}.${sig.toString('base64')}`;
    } else {
      mode = 'p';
    }

    this.writeRaw({ app, command, mode, payload });
  }
}

module.exports = { Session };
