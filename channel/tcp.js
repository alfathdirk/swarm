const net = require('net');
const { Channel } = require('../channel');
const { URL } = require('url');
const debug = require('../helpers/debug');

class Tcp extends Channel {
  constructor ({ port = 1212, host = '0.0.0.0' } = {}) {
    super();

    this.host = host;
    this.port = port;
  }

  get kind () {
    return 'tcp';
  }

  get listening () {
    return this.server ? this.server.listening : false;
  }

  async up () {
    debug('Channel:Tcp', `Up at ${this.host}:${this.port}...`);
    this.server = net.createServer(socket => {
      let { address, port } = socket.address();
      debug('Channel:Tcp', 'incoming from', address, port);
      let url = `tcp://${address}:${port}`;
      this.emit('incoming', { socket, url });
    });

    await new Promise((resolve, reject) => {
      this.server.listen(this.port, this.host, () => {
        clearTimeout(timeout);
        resolve();
      });
      let timeout = setTimeout(reject, 30000);
    });
  }

  async connect (url) {
    debug('Channel:Tcp', `connect to ${url}...`);
    let u = new URL(url);
    let port = u.port;
    let host = u.hostname;

    let socket = await new Promise((resolve, reject) => {
      let socket = net.connect(port, host, () => resolve(socket));
      socket.on('error', reject);
    });

    return socket;
  }

  async down () {
    debug('Channel:Tcp', `downing...`);
    if (!this.server) {
      return;
    }

    await new Promise(resolve => {
      this.server.close(resolve);
      this.server = null;
    });
  }
}

module.exports = Tcp;
