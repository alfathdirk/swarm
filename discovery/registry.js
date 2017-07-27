const { Discovery } = require('./discovery');

class DiscoveryRegistry {
  constructor (definitions = [], bootPeers = []) {
    this.methods = [];

    if (bootPeers && bootPeers.length) {
      let definition = definitions.find(definition => definition.kind === 'boot');
      if (definition) {
        definition.bootPeers = (definition.bootPeers || []).concat(bootPeers);
      } else {
        definitions.unshift({ kind: 'boot', bootPeers });
      }
    }

    definitions.forEach(definition => this.add(this.resolve(definition)));
  }

  add (method) {
    this.methods.push(method);
  }

  resolve (definition) {
    if (definition instanceof Discovery) {
      return definition;
    }

    if (!definition.kind) {
      throw new Error('Invalid discovery method definition');
    }

    let DiscoveryAdapter;
    try {
      DiscoveryAdapter = require(`./adapters/${definition.kind}`);
    } catch (err) {
      throw new Error(`Discovery adapter not found ${definition.kind}`);
    }

    return new DiscoveryAdapter(definition);
  }

  async discover () {
    let result = [];
    await Promise.all(this.methods.map(async method => {
      (await method.discover()).forEach(definition => result.push(definition));
    }));
    return result;
  }
}

module.exports = { DiscoveryRegistry };
