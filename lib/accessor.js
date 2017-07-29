module.exports = function accessor (app, swarm) {
  return {
    get address () {
      return swarm.address;
    },

    addDiscovery (method) {
      return swarm.addDiscovery(method);
    },

    removeDiscovery (method) {
      return swarm.removeDiscovery(method);
    },

    broadcast ({ command, payload }) {
      return swarm.broadcast({ app: app.name, command, payload });
    },

    send ({ address, command, payload }) {
      return swarm.send({ address, app: app.name, command, payload });
    },

    getPeerDefinition (address) {
      let peer = swarm.get(address);
      if (peer) {
        return peer.dump();
      }
    },
  };
};
