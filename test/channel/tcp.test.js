const assert = require('assert');
const Tcp = require('../../channel/adapters/tcp');

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
        assert(!channel.listening);
        await channel.up();
        assert(channel.listening);
        await channel.down();
      } catch (err) {
        try { await channel.down(); } catch (err) {}
        throw err;
      }
    });
  });

  // describe('#down()', () => {
  //   it('stop listening', () => {

  //   });
  // });
});
