const assert = require('assert');
const Memory = require('../../storage/memory');

describe('Storage:Memory', () => {
  let storage;

  beforeEach(() => {
    storage = new Memory();
  });

  describe('#write()', () => {
    it('write data to memory', async () => {
      await storage.write('foo', 'foo');

      assert(storage.data.foo, 'foo');
    });
  });

  describe('#read()', () => {
    it('read data from memory', async () => {
      storage.data.foo = 'foox';
      let value = await storage.read('foo');
      assert(value, 'foox');
    });
  });
});
