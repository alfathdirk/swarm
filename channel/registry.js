const { Channel } = require('./channel');
const assert = require('assert');
const os = require('os');
const EventEmitter = require('events');

class ChannelRegistry extends EventEmitter {
  constructor (definitions) {
    super();

    this.channels = [];

    definitions.forEach(definition => this.add(this.resolve(definition)));
  }

  add (channel) {
    assert(channel instanceof Channel, 'channel must be instance of Channel');

    this.channels.push(channel);
  }

  resolve (definition) {
    if (definition instanceof Channel) {
      return definition;
    }

    assert(definition.kind, 'Invalid channel definition');

    let ChannelAdapter;
    try {
      ChannelAdapter = require(`./adapters/${definition.kind}`);
    } catch (err) {
      throw new Error(`Channel adapter not found ${definition.kind}`);
    }

    let channel = new ChannelAdapter(definition);
    // TODO: revisit this later
    channel.on('incoming', session => this.emit('incoming', session));

    return channel;
  }

  async boot () {
    await Promise.all(this.channels.map(channel => channel.up()));
  }

  async deboot () {
    await Promise.all(this.channels.map(channel => channel.down()));
  }

  forUrl (url) {
    let proto = url.split(':').shift();
    return this.channels.find(channel => channel.kind === proto);
  }

  getEligibleUrls () {
    let ips = getIps();
    let urls = [];
    this.channels.forEach(channel => channel.ipUrls(ips).forEach(url => urls.push(url)));
    return urls;
  }
}

function getIps () {
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

module.exports = { ChannelRegistry };
