const assert = require('assert');
const { Channel } = require('./channel');
const { Peer } = require('./peer');
const { Discovery } = require('./discovery');
const { Identity } = require('./identity');
const { EventEmitter } = require('events');
const Memory = require('./storage/memory');
const { Session } = require('./session');
const debug = require('./helpers/debug');

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
   * channels
   * apps
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

    this.initChannels(channels);
    this.initDiscovery(discovery, bootPeers);
    // discovery instanceof Discovery ? discovery : new Discovery({ channels: this.channels, methods: discovery, bootPeers });
  }

  initChannels (definitions = []) {
    this.channels = {};
    definitions.forEach(definition => this.addChannel(definition));
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

  addChannel (channel) {
    channel = this.resolveChannel(channel);
    channel.on('incoming', async ({ socket, url }) => {
      let session = new Session({ identity: this.identity, url, socket });
      let peer = this.resolvePeer();
      await this.connect(peer, session);
      this.addPeer(peer);
      debug('Swarm', `incoming session ${session.peerIdentity.address}`);
    });
    this.channels[channel.kind] = channel;
  }

  addPeer (peer) {
    this.peers.push(peer);
  }

  async start () {
    await this.bootstrapIdentity();
    await this.bootstrapChannels();
    await this.bootstrapPeers();
    // await this.apps.bootstrap();

    await new Promise(resolve => setTimeout(resolve));
  }

  async stop () {
    // await this.apps.debootstrap();
    await this.debootstrapPeers();
    await this.debootstrapChannels();
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

  async bootstrapChannels () {
    await Promise.all(Object.values(this.channels).map(channel => channel.up()));
  }

  async debootstrapChannels () {
    await Promise.all(Object.values(this.channels).map(channel => channel.down()));
  }

  async bootstrapPeers () {
    await Promise.all(Object.values(this.discovery).map(async method => {
      let peers = await method.discover();
      await Promise.all(peers.map(async peer => {
        peer = this.resolvePeer(peer);
        this.addPeer(peer);
        await this.connect(peer);
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

    let { channels, identity } = this;
    return new Peer(Object.assign({ channels, identity }, peer));
  }

  async connect (peer, socket) {
    let advertisement = this.getAdvertisement();
    await peer.connect(advertisement, socket);
    this.emit('connect', peer);
  }

  getAdvertisement () {
    return {
      identity: this.identity.dump(),
      urls: this.getEligibleUrls(),
    };
  }

  // FIXME: revisit generating eligible urls
  getEligibleUrls () {
    return [];
  }

  async disconnect (peer) {
    await peer.disconnect();
    this.emit('disconnect', peer);
  }

  resolveChannel (channel) {
    if (channel instanceof Channel) {
      return channel;
    }

    assert(channel.kind, 'Invalid channel definition');

    let ChannelAdapter;
    try {
      ChannelAdapter = require(`./channel/${channel.kind}`);
    } catch (err) {
      throw new Error(`Channel adapter not found ${channel.kind}`);
    }

    return new ChannelAdapter(channel);
  }
}

module.exports = { Swarm };
