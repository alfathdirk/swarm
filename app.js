const { EventEmitter } = require('events');

class App extends EventEmitter {
  get accessor () {
    if (!this._accessor) {
      throw new Error('App does not have accessor, maybe not up yet');
    }

    return this._accessor;
  }

  set accessor (accessor) {
    this._accessor = accessor;
  }

  addDiscovery (...args) {
    return this.accessor.addDiscovery(...args);
  }

  removeDiscovery (...args) {
    return this.accessor.removeDiscovery(...args);
  }

  broadcast (...args) {
    return this.accessor.broadcast(...args);
  }

  send (...args) {
    return this.accessor.send(...args);
  }

  getPeerDefinition (...args) {
    return this.accessor.getPeerDefinition(...args);
  }
}

module.exports = { App };
