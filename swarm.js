const { Session } = require('./session');
const { Peer } = require('./peer');
const { DiscoveryRegistry } = require('./discovery');
const { Identity } = require('./identity');
const { EventEmitter } = require('events');
const assert = require('assert');
const Memory = require('./storage/memory');
const debug = require('debug')('swarm:swarm');
const getIps = require('./lib/get-ips');
const sleep = require('./lib/sleep');
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
    networkId = '0',
    storage = new Memory(),
    discovery = [],
    bootPeers = [],
    maxPeers = 25,
    apps = [],
  } = {}) {
    super();

    this.networkId = networkId;
    this.storage = storage;
    // this.apps = new AppRegistry(apps);
    this.peers = [];
    this.maxPeers = maxPeers;

    this.channels = [];

    this.discovery = discovery instanceof DiscoveryRegistry
      ? discovery
      : new DiscoveryRegistry(discovery, bootPeers);
  }

  get address () {
    return this.identity.address;
  }

  get advertisement () {
    return {
      address: this.identity.address,
      publicKey: this.identity.publicKey,
      urls: this.getChannelUrls(),
      apps: this.getEligibleApps(),
    };
  }

  addChannel (channel) {
    this.channels.push(channel);
  }

  getChannelUrls () {
    let ips = getIps();
    let urls = [];
    this.channels.forEach(channel => channel.ipUrls(ips).forEach(url => urls.push(url)));
    return urls;
  }

  async send (address, data) {
    let peer = await this.getPeer(address);

    assert(peer, `Peer not found at ${address}`);
    return peer.send(data);
  }

  getPeer (address) {
    return this.peers.find(peer => peer.address === address);
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
  async addPeer (definition) {
    let peer = this.resolvePeer(definition);

    await this.connectPeer(peer);

    this.peers.push(peer);

    this.emit('connect', peer);
  }

  resolvePeer (definition) {
    if (definition instanceof Peer) {
      return definition;
    }

    if (typeof definition === 'string') {
      definition = { urls: [ definition ] };
    }

    return new Peer(definition);
  }

  async connectPeer (peer) {
    assert(peer instanceof Peer, 'Invalid peer');
    if (!peer.session) {
      await this.dialPeer(peer);
    }
    await peer.handshake();
  }

  async disconnectPeer (peer) {
    assert(peer instanceof Peer, 'Invalid peer');

    debug('Disconnecting peer ...');

    if (!peer.session) {
      return;
    }

    await peer.session.end();
    peer.session = null;

    this.emit('disconnect', this);
  }

  async dialPeer (peer) {
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
    await this.bootIdentity();
    await this.bootChannels();
    await this.bootPeers();
    // await this.apps.bootstrap();
    await sleep();
  }

  async stop () {
    // await this.apps.debootstrap();
    await this.debootPeers();
    await this.debootChannels();
    await this.debootIdentity();
    await sleep();
  }

  async bootChannels () {
    await Promise.all(this.channels.map(channel => this.startChannel(channel)));
  }

  async debootChannels () {
    await Promise.all(this.channels.map(channel => this.stopChannel(channel)));
  }

  async startChannel (channel) {
    channel.on('incoming', async ({ url, socket }) => {
      try {
        debug(`Incoming socket from ${url}`);
        let session = this.createSession({ url, socket });
        await this.addPeer({ session });
      } catch (err) {
        // TODO: notify socket about error
        console.error('Error on incoming', err);
      }
    });

    await channel.up();
  }

  async stopChannel (channel) {
    channel.removeAllListeners('incoming');
    await channel.down();
  }

  createSession ({ url, socket }) {
    let swarm = this;
    return new Session({ swarm, url, socket });
  }

  async initIdentity () {
    this.identity = new Identity();
    await this.storage.write('privkey.pem', this.identity.privateKey);
  }

  async bootIdentity () {
    if (await this.storage.exists('privkey.pem')) {
      this.identity = new Identity(await this.storage.read('privkey.pem'));
    } else {
      await this.initIdentity();
    }
  }

  /* async */ debootIdentity () {
    this.identity = null;
  }

  async bootPeers () {
    let definitions = await this.discovery.discover();
    await Promise.all(definitions.map(async definition => {
      await this.addPeer(definition);
    }));
  }

  async debootPeers () {
    await Promise.all(this.peers.map(peer => this.disconnectPeer(peer)));

    this.peers = [];
  }

  // TODO: revisit this later when app implemented
  getEligibleApps () {
    return [];
  }

  getChannelByUrl (url) {
    let proto = url.split(':').shift();
    return this.channels.find(channel => channel.kind === proto);
  }
}

module.exports = { Swarm };
