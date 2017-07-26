const net = require('net');
const { Channel, ChannelSession } = require('../index');
const { URL } = require('url');
const debug = require('debug')('swarm:channel:adapters:tcp');

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
    debug(`Getting up at ${this.host}:${this.port} ...`);
    this.server = net.createServer(socket => {
      let { address, port } = socket.address();
      let url = `tcp://${address}:${port}`;
      this.emit('incoming', new ChannelSession({ url, socket }));

      debug(`Incoming from ${url}`);
    });

    await new Promise((resolve, reject) => {
      this.server.listen(this.port, this.host, () => {
        clearTimeout(timeout);
        resolve();
      });
      let timeout = setTimeout(reject, 30000);
    });
  }

  connect (url) {
    debug(`Connecting to ${url} ...`);
    let u = new URL(url);
    let port = u.port;
    let host = u.hostname;
    let socket = net.connect(port, host);
    return new ChannelSession({ url, socket });
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

  ipUrls (ips) {
    return ips.map(ip => `tcp:/${ip}:${this.port}`);
  }
}

module.exports = Tcp;
