class Memory {
  constructor () {
    this.data = {};
  }

  write (key, value) {
    this.data[key] = value;
  }

  read (key) {
    return this.data[key];
  }

  exists (key) {
    return key in this.data;
  }

  inspect () {
    return {};
  }
}

module.exports = Memory;
