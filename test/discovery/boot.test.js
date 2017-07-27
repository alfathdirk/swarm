const assert = require('assert');
const Boot = require('../../discovery/adapters/boot');

describe('Discovery:Boot', () => {
  describe('constructor', () => {
    it('assign bootPeers', () => {
      let method = new Boot({ bootPeers: [ 'foo:1', 'foo:2', 'foo:3' ] });
      assert.equal(method.bootPeers.length, 3);
    });
  });

  describe('#discover()', () => {
    it('return boot peers', async () => {
      let method = new Boot({ bootPeers: [ 'foo:1', 'foo:2', 'foo:3' ] });
      let result = await method.discover();
      assert.equal(result.length, 3);
    });
  });
});
