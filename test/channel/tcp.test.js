const assert = require('assert');
const Tcp = require('../../channel/tcp');

describe('Channel:Tcp', () => {
  describe('constructor', () => {
    it('define listening port', () => {
      let channel = new Tcp();
      assert.equal(channel.port, 1212);
    });
  });

  describe('#up()', () => {
    it('start listening', async () => {
      let channel = new Tcp();
      try {
        await channel.up();
        assert(channel.server.listening);
        await channel.down();
      } catch (err) {
        try { await channel.down(); } catch (err) {}
        throw err;
      }
    });
  });
});
