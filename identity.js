const RSA = require('node-rsa');
const sha3256 = require('js-sha3').sha3_256;

const KEY_SIZE = 512;

class Identity {
  constructor (key, address) {
    if (!key || typeof key !== 'string') {
      this.generate(key);
      return;
    }

    this.key = new RSA(key);
    this.address = address || (this.key.isPrivate() ? sha3256(key).slice(-20) : address);
  }

  get privateKey () {
    return this.key.exportKey('private');
  }

  get publicKey () {
    return this.key.exportKey('public');
  }

  generate (key) {
    this.key = new RSA(key || { b: KEY_SIZE });
    let privateKey = this.privateKey;
    this.address = sha3256(privateKey).slice(-20);
    return privateKey;
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
