const net = require('net');
const { URL } = require('url');
const debug = require('debug')('swarm:channel:tcp');
const { Channel } = require('../channel');

class Tcp extends Channel {
  constructor ({ port = 1212, host = '0.0.0.0' } = {}) {
    super();

    this.host = host;
    this.port = port;
  }

  get proto () {
    return 'tcp';
  }

  async up () {
    debug(`Getting up at ${this.host}:${this.port} ...`);
    this.server = net.createServer(this._onListening.bind(this));

    await new Promise((resolve, reject) => {
      this.server.listen(this.port, this.host, () => {
        clearTimeout(timeout);
        resolve();
      });
      let timeout = setTimeout(reject, 30000);
    });
  }

  _onListening (socket) {
    let { address, port } = socket.address();
    let url = `${this.proto}://${address}:${port}`;
    this.emit('incoming', { url, socket });
  }

  connect (url) {
    debug(`Connecting to ${url} ...`);
    let u = new URL(url);
    let port = u.port;
    let host = u.hostname;
    return net.connect(port, host);
  }

  async down () {
    debug(`Getting down ...`);
    if (!this.server) {
      return;
    }

    await new Promise(resolve => {
      this.server.close(resolve);
      this.server = null;
    });
  }

  formatUrl (ip, port) {
    return `${this.proto}://${ip}:${this.port}`;
  }
}

module.exports = Tcp;
