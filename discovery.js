// const { Peer } = require('./peer');
// class OldDiscovery {
//   constructor ({ identity, channels = [], methods = [], bootPeers = [] } = {}) {
//     this.channels = channels;
//     this.methods = {};

//     if (bootPeers && bootPeers.length) {
//       let method = methods.find(method => method.kind === 'boot');
//       if (method) {
//         method.bootPeers = (method.bootPeers || []).concat(bootPeers);
//       } else {
//         methods.push({ kind: 'boot', bootPeers });
//       }
//     }

//     methods.forEach(definition => {
//       this.registerMethod(definition);
//     });
//   }

//   async discover () {
//     let result = [];
//     await Promise.all(Object.keys(this.methods).map(async key => {
//       let method = this.methods[key];
//       let peers = await method.discover();
//       peers.forEach(peer => {
//         result.push(this.resolve(peer));
//       });
//     }));
//     return result;
//   }

//   resolve (peer) {
//     if (peer instanceof Peer) {
//       return peer;
//     }

//     // TODO: revisit this code
//     peer.channels = this.channels;
//     peer.identity = this.identity;

//     let { channels, identity } = this;
//     return new Peer(Object.assign({ channels, identity }, peer));
//   }

//   registerMethod (method) {
//     method = this.resolveMethod(method);

//     this.methods[method.kind] = method;
//   }

//   // resolveMethod (method) {
//   //   if (method instanceof DiscoveryMethod) {
//   //     return method;
//   //   }

//   //   if (!method.kind) {
//   //     throw new Error('Invalid discovery method definition');
//   //   }

//   //   let Method;
//   //   try {
//   //     Method = require(`./discovery/${method.kind}`);
//   //   } catch (err) {
//   //     throw new Error(`Channel adapter not found ${method.kind}`);
//   //   }

//   //   return new Method(method);
//   // }
// }

class Discovery {

}

module.exports = { Discovery };
