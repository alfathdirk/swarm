const RSA = require('node-rsa');
const sha3256 = require('js-sha3').sha3_256;

const KEY_SIZE = 512;

class Identity {
  constructor (key) {
    if (key && typeof key === 'string') {
      this.key = new RSA(key);
    } else {
      this.generate(key);
    }

    this.address = sha3256(this.publicKey).slice(-20);
  }

  get privateKey () {
    return this.key.exportKey('private');
  }

  get publicKey () {
    return this.key.exportKey('public');
  }

  generate (key) {
    this.key = new RSA(key || { b: KEY_SIZE });
  }

  encrypt (...args) {
    return this.key.encrypt(...args);
  }

  decrypt (...args) {
    return this.key.decrypt(...args);
  }

  sign (...args) {
    return this.key.sign(...args);
  }

  verify (...args) {
    return this.key.verify(...args);
  }

  dump () {
    let { address, publicKey } = this;
    return { address, publicKey };
  }
}

module.exports = { Identity };
