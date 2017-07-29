# Swarm

Object to manage network by swarming peers.

```js

let swarm = new Swarm();
swarm.add('tcp://foo.bar:12121');
swarm.start();
```

## Options

- dataDir string
- networkId string
- discovery array<DiscoveryDefinition>
- channels array<ChannelDefinition>
- bootPeers array<PeerUrl>
- maxPeers number

## Models

- DiscoveryDefinition object
  - kind string
  - ...
  + examples: { kind: 'boot' }

- ChannelDefinition object
  - kind string
  - ...
  + examples: { kind: 'http', port: 1212 }

- PeerUrl string
  + examples: http://192.168.1.101:1212

## Discovery Methods

Discovery method defines how to discover other peers.

Module implementation bound to swarm by node.js module. This kind of implementation must conform node module name as `12imam-discovery-<name>`

### Builtin

- boot
- peer
- dns (later)

### Module

- mdns

## Channel

Channel is a communication link between peers.

Module implementation bound to swarm by node.js module. This kind of implementation must conform node module name as `12imam-channel-<name>`

### Builtin

- http (rest)

### Module

- webrtc
- tcp
- udp

## Application

Application may run on top of swarm.

Module implementation bound to swarm by node.js module. This kind of implementation must conform node module name as `12imam-app-<name>`

### Builtin

- chat

### Module

- cryptocurrency
