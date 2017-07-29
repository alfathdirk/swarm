const { Session } = require('./session');
const { Peer } = require('./peer');
const { Identity } = require('./identity');
const { EventEmitter } = require('events');
const assert = require('assert');
const Memory = require('./storage/memory');
const debug = require('debug')('swarm:swarm');
const getIps = require('./lib/get-ips');
const sleep = require('./lib/sleep');
const assertModule = require('./lib/assert-module');
const accessor = require('./lib/accessor');

/**
 * Object to initiate swarm network or join to network
 */
class Swarm extends EventEmitter {
  /**
   *
   * @param {object} options Options to initiate swarm
   *
   * Available options:
   *
   * networkId - The network id
   * storage - Storage instance
   * bootPeers
   * maxPeers
   */
  constructor ({
    networkId = '0',
    storage = new Memory(),
    bootPeers = [],
    maxPeers = 25,
  } = {}) {
    super();

    this.networkId = networkId;
    this.storage = storage;
    this.bootPeers = bootPeers;
    this.maxPeers = maxPeers;
    this.channels = [];
    this.peers = [];
    this.discovery = [];
    this.apps = [];
    this.started = false;
  }

  get address () {
    return this.identity.address;
  }

  get publicKey () {
    return this.identity.publicKey;
  }

  get urls () {
    let ips = getIps();
    let urls = [];
    this.channels.forEach(channel => {
      ips.forEach(ip => {
        urls.push(channel.formatUrl(ip));
      });
    });
    return urls;
  }

  get appNames () {
    return this.apps.map(app => app.name);
  }

  get advertisement () {
    return {
      address: this.address,
      publicKey: this.publicKey,
      urls: this.urls,
      apps: this.appNames,
    };
  }

  addChannel (channel) {
    assertModule.channel(channel);

    this.channels.push(channel);
  }

  async send ({ address, app, command, payload }) {
    assert(typeof address === 'string', 'Address must be string');

    let peer = await this.lookup(address);

    assert(peer, `Peer not found, ${address}`);

    return peer.send({ app, command, payload });
  }

  broadcast ({ app, command, payload }) {
    this.peers.forEach(peer => {
      if (peer.apps.indexOf(app) === -1) {
        return;
      }

      peer.send({ app, command, payload });
    });
  }

  get (address) {
    assert(typeof address === 'string', 'Address must be string');

    return this.peers.find(peer => peer.address === address);
  }

  /**
   * Lookup peer by its address
   *
   * The function will try to find from connected peers first.
   *
   * When peer with specified address not found, then lookup to discovery methods.
   *
   * @param {string} address
   */
  async lookup (address) {
    debug(`Looking up peer ${address}`);
    let peer = this.get(address);
    if (peer) {
      return peer;
    }

    if (!this.discovery.length) {
      debug('Avoid lookup to discovery when no discovery');
      return;
    }

    peer = await Promise.race(this.discovery.map(async method => {
      try {
        let definition = await method.lookup(address);
        let peer = await this.add(definition);
        return peer;
      } catch (err) {
        console.error('Error discovery lookup', err);
      }
    }));
    return peer;
  }

  /**
   * Add peer to the swarm
   *
   * Several things will happen:
   *
   * - Resolve definition into peer instance
   * - Connect to peer instance
   * - Add peer to peers collection
   * - Emit connect
   *
   * When something wrong, function will throw an error
   *
   * @param {*} definition url string or peer definition or peer instance
   */
  async add (definition) {
    if (!this.started) {
      this.bootPeers.push(definition);
      return;
    }

    let peer = this.resolve(definition);

    await this.connect(peer);

    this.peers.push(peer);

    this.emit('connect', peer);

    return peer;
  }

  resolve (definition) {
    if (definition instanceof Peer) {
      return definition;
    }

    if (typeof definition === 'string') {
      definition = { urls: [ definition ] };
    }

    return new Peer(definition);
  }

  async connect (peer) {
    assert(peer instanceof Peer, 'Invalid peer');
    if (!peer.session) {
      await this.dial(peer);
    }
    await peer.handshake();
  }

  async disconnect (peer) {
    assert(peer instanceof Peer, 'Invalid peer');

    debug('Disconnecting peer ...');

    if (!peer.session) {
      return;
    }

    await peer.session.end();
    peer.session = null;

    this.emit('disconnect', this);
  }

  async dial (peer) {
    assert(peer instanceof Peer, 'Invalid peer');

    for (let url of peer.urls) {
      let channel = this.getChannelByUrl(url);
      if (channel) {
        try {
          let socket = await channel.connect(url);
          peer.session = this.createSession({ url, socket, initiate: true });
          return peer.session;
        } catch (err) {
          // TODO: notify socket about error
          console.error(err);
          console.error(`Channel connect error url[${url}] message[${err.message}]`);
        }
      }
    }

    throw new Error('Dial error');
  }

  async start () {
    this.started = true;
    await this._bootIdentity();
    await this._bootChannels();
    await this._bootApps();
    await this._bootPeers();
    await sleep();
  }

  async stop () {
    await this._debootPeers();
    await this._debootApps();
    await this._debootChannels();
    await this._debootIdentity();
    this.started = false;
    await sleep();
  }

  async _bootApps () {
    this.on('message', this._onMessage.bind(this));

    await Promise.all(this.apps.map(async app => {
      try {
        await this.startApp(app);
      } catch (err) {
        console.error(`Failed to start app ${app.name}, cause: ${err.message}`);
      }
    }));
  }

  async _onMessage ({ address, app, command, payload }) {
    // TODO: implement rate limit
    try {
      let appO = this.getApp(app);
      if (!appO) {
        return;
      }

      await appO.onMessage({ address, command, payload });
    } catch (err) {
      console.error('Error on message routing', err);
    }
  }

  getApp (name) {
    return this.apps.find(app => app.name === name);
  }

  async _debootApps () {
    await Promise.all(this.apps.map(async app => {
      try {
        await this.stopApp(app);
      } catch (err) {
        console.error(`Failed to stop app ${app.name}, cause: ${err.message}`);
      }
    }));

    this.removeAllListeners('message');
  }

  async startApp (app) {
    await app.up();
  }

  async stopApp (app) {
    await app.down();
  }

  async _bootChannels () {
    await Promise.all(this.channels.map(async channel => {
      try {
        await this.startChannel(channel);
      } catch (err) {
        console.error(`Failed to start channel ${channel.proto}, cause: ${err.message}`);
      }
    }));
  }

  async _debootChannels () {
    await Promise.all(this.channels.map(async channel => {
      try {
        await this.stopChannel(channel);
      } catch (err) {
        console.error(`Failed to stop channel ${channel.proto}, cause: ${err.message}`);
      }
    }));
  }

  async startChannel (channel) {
    channel.on('incoming', this._onChannelIncoming.bind(this));

    await channel.up();
  }

  async stopChannel (channel) {
    channel.removeAllListeners('incoming');

    await channel.down();
  }

  async _onChannelIncoming ({ url, socket }) {
    try {
      // debug(`Incoming socket from ${url}`);
      let session = this.createSession({ url, socket });
      await this.add({ session });
    } catch (err) {
      // TODO: notify socket about error, must define error messaging
      console.error('Error on incoming', err);
    }
  }

  createSession ({ url, socket }) {
    let swarm = this;
    return new Session({ swarm, url, socket });
  }

  async initIdentity () {
    this.identity = new Identity();
    await this.storage.write('privkey.pem', this.identity.privateKey);
  }

  async _bootIdentity () {
    if (await this.storage.exists('privkey.pem')) {
      this.identity = new Identity(await this.storage.read('privkey.pem'));
    } else {
      await this.initIdentity();
    }
  }

  _debootIdentity () {
    this.identity = null;
  }

  async _bootPeers () {
    await Promise.all(this.bootPeers.map(async definition => {
      // connecting to boot peer is not mandatory
      try {
        await this.add(definition);
      } catch (err) {
        console.error('Could not add boot peer');
      }
    }));
  }

  async _debootPeers () {
    await Promise.all(this.peers.map(peer => this.disconnect(peer)));

    this.peers = [];
  }

  getChannelByUrl (url) {
    let proto = url.split(':').shift();
    return this.channels.find(channel => channel.proto === proto);
  }

  addApp (app) {
    assertModule.app(app);

    app.accessor = accessor(app, this);

    this.apps.push(app);
  }

  removeApp (app) {
    app.accessor = null;

    let index = this.apps.findIndex(a => a === app);
    if (index >= 0) {
      this.apps.splice(index, 1);
    }
  }

  addDiscovery (method) {
    assertModule.discovery(method);

    this.discovery.push(method);
  }

  removeDiscovery (method) {
    let index = this.discovery.findIndex(m => m === method);
    if (index >= 0) {
      this.discovery.splice(index, 1);
    }
  }
}

module.exports = { Swarm };
