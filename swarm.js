const assert = require('assert');
const { Channel } = require('./channel');
const { Peer } = require('./peer');
const { Discovery } = require('./discovery');
const { Identity } = require('./identity');
const { EventEmitter } = require('events');
const Memory = require('./storage/memory');
const { Session } = require('./session');
const debug = require('./helpers/debug');
const os = require('os');

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

  get address () {
    return this.identity.address;
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
    this.channels[channel.kind] = channel;
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

    return this.newPeer(peer);
  }

  newPeer (peer) {
    let { channels } = this;
    return new Peer(Object.assign({ channels }, peer));
  }

  async connect (peer, session) {
    if (!session) {
      let { socket, url } = await this.dial(peer);
      session = this.newSession({ url, socket, initiate: true });
    }

    let advertisement = this.getAdvertisement();
    let advertised = await session.handshake(this.identity, advertisement);
    Object.assign(peer, advertised);
    peer.session = session;

    this.emit('connect', peer);
  }

  newSession ({ url, socket, initiate }) {
    let session = new Session({ url, socket, initiate });
    session.on('message', message => this.emit('message', message));
    return session;
  }

  async dial (peer) {
    for (let url of peer.urls) {
      let proto = url.split(':').shift();
      let channel = this.channels[proto];
      if (channel) {
        try {
          let socket = await channel.connect(url);
          return { socket, url };
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
      urls: this.getEligibleUrls(),
      apps: this.getEligibleApps(),
    };
  }

  // TODO: revisit this later when app implemented
  getEligibleApps () {
    return [];
  }

  getEligibleUrls () {
    let ips = this.getIps();
    let urls = [];
    Object.values(this.channels).forEach(channel => channel.ipUrls(ips).forEach(url => urls.push(url)));
    return urls;
  }

  getIps () {
    let ifaces = os.networkInterfaces();
    let result = [];
    Object.values(ifaces).forEach(iface => {
      iface.forEach(ip => {
        if (ip.family === 'IPv6') return;
        result.push(ip.address);
      });
    });

    return result;
  }

  async disconnect (peer) {
    await peer.hangup();
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

    channel = new ChannelAdapter(channel);
    channel.on('incoming', async ({ socket, url }) => {
      let session = this.newSession({ url, socket });
      let peer = this.newPeer();
      await this.connect(peer, session);
      this.addPeer(peer);
      debug('Swarm', `incoming session ${session.peerIdentity.address}`);
    });

    return channel;
  }
}

module.exports = { Swarm };
