const { ChannelRegistry } = require('./channel');
const { Peer } = require('./peer');
const { Discovery } = require('./discovery');
const { Identity } = require('./identity');
const { EventEmitter } = require('events');
const assert = require('assert');
const Memory = require('./storage/memory');
const debug = require('debug')('swarm:swarm');

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
   * discovery - Discovery method definitions
   * bootPeers
   * maxPeers
   * channels - Channel definitions
   * apps - App definitions
   */
  constructor ({
    networkId = '',
    storage = new Memory(),
    discovery = [],
    bootPeers = [],
    maxPeers = 25,
    channels = [],
    apps = [],
  } = {}) {
    super();

    this.networkId = networkId;
    this.storage = storage;
    // this.apps = new AppRegistry(apps);
    this.peers = [];
    this.maxPeers = maxPeers;

    this.channels = channels instanceof ChannelRegistry ? channels : new ChannelRegistry(channels);

    this.initDiscovery(discovery, bootPeers);
  }

  get address () {
    return this.identity.address;
  }

  initDiscovery (definitions = [], bootPeers = []) {
    this.discovery = {};

    if (bootPeers && bootPeers.length) {
      let definition = definitions.find(definition => definition.kind === 'boot');
      if (definition) {
        definition.bootPeers = (definition.bootPeers || []).concat(bootPeers);
      } else {
        definitions.unshift({ kind: 'boot', bootPeers });
      }
    }
    definitions.forEach(definition => {
      this.addDiscovery(definition);
    });
  }

  addDiscovery (method) {
    method = this.resolveDiscovery(method);
    this.discovery[method.kind] = method;
  }

  resolveDiscovery (definition) {
    if (definition instanceof Discovery) {
      return definition;
    }

    if (!definition.kind) {
      throw new Error('Invalid discovery method definition');
    }

    let DiscoveryAdapter;
    try {
      DiscoveryAdapter = require(`./discovery/${definition.kind}`);
    } catch (err) {
      throw new Error(`Discovery adapter not found ${definition.kind}`);
    }

    return new DiscoveryAdapter(definition);
  }

  send (address, data) {
    let peer = this.findPeer(address);
    return peer.send(data);
  }

  findPeer (address) {
    return this.peers.find(peer => peer.identity.address === address);
  }

  addPeer (peer) {
    this.peers.push(peer);
  }

  async start () {
    await this.bootstrapIdentity();

    this.channels.on('incoming', async session => {
      let peer = this.newPeer();
      await this.connect(peer, session);
      this.addPeer(peer);

      debug(`Incoming session from ${session.peerIdentity.address}`);
    });
    await this.channels.boot();
    await this.bootstrapPeers();
    // await this.apps.bootstrap();

    await new Promise(resolve => setTimeout(resolve));
  }

  async stop () {
    // await this.apps.debootstrap();
    await this.debootstrapPeers();

    await this.channels.deboot();
    this.channels.removeAllListeners('incoming');

    await this.debootstrapIdentity();

    await new Promise(resolve => setTimeout(resolve));
  }

  async init () {
    this.identity = new Identity();
    await this.storage.write('privkey.pem', this.identity.privateKey);
  }

  async bootstrapIdentity () {
    if (await this.storage.exists('privkey.pem')) {
      this.identity = new Identity(await this.storage.read('privkey.pem'));
    } else {
      await this.init();
    }
  }

  /* async */ debootstrapIdentity () {
    this.identity = null;
  }

  async bootstrapPeers () {
    await Promise.all(Object.values(this.discovery).map(async method => {
      let peers = await method.discover();
      await Promise.all(peers.map(async peer => {
        peer = this.resolvePeer(peer);
        let session = await this.dial(peer);
        await this.connect(peer, session);
        this.addPeer(peer);
      }));
    }));
  }

  async debootstrapPeers () {
    await Promise.all(this.peers.map(peer => this.disconnect(peer)));

    this.peers = [];
  }

  resolvePeer (peer) {
    if (peer instanceof Peer) {
      return peer;
    }

    return this.newPeer(peer);
  }

  newPeer (peer) {
    return new Peer(peer);
  }

  async connect (peer, session) {
    assert(peer, 'Peer must specified');
    assert(session, 'Session must specified');

    // TODO: potentially memory leak, find way to avoid event delegation
    session.on('message', message => this.emit('message', message));

    let advertisement = this.getAdvertisement();
    let advertised = await session.handshake(this.identity, advertisement);
    Object.assign(peer, advertised);
    peer.session = session;

    this.emit('connect', peer);
  }

  async dial (peer) {
    for (let url of peer.urls) {
      let channel = this.channels.forUrl(url);
      if (channel) {
        try {
          let session = await channel.connect(url);
          return session;
        } catch (err) {
          console.error(err);
          console.error(`Channel connect error url[${url}] message[${err.message}]`);
        }
      }
    }

    throw new Error('Dial error');
  }

  getAdvertisement () {
    return {
      urls: this.channels.getEligibleUrls(),
      apps: this.getEligibleApps(),
    };
  }

  // TODO: revisit this later when app implemented
  getEligibleApps () {
    return [];
  }

  async disconnect (peer) {
    debug('Disconnecting peer ...');
    if (!peer.session) {
      return;
    }

    let { session } = peer;
    peer.session = null;
    await session.end();

    session.removeAllListeners('message');

    this.emit('disconnect', peer);
  }
}

module.exports = { Swarm };
