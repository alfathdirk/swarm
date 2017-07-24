// TODO: move to swarm
// const assert = require('assert');
// const sinon = require('sinon');
// const { Discovery, DiscoveryMethod } = require('../discovery');
// const Boot = require('../discovery/boot');

// describe('Discovery', () => {
//   describe('constructor', () => {
//     it('auto add boot discovery when boot peers specified', () => {
//       let discovery = new Discovery({ bootPeers: [ 'foo:bar' ] });
//       assert('boot' in discovery.methods);
//     });
//   });

//   describe('#resolveMethod()', () => {
//     it('return identity discovery method when instance is specified', () => {
//       let discovery = new Discovery();
//       let method = new DiscoveryMethod({ kind: 'foo' });
//       assert(discovery.resolveMethod(method), method);
//     });

//     it('return discovery method when definition is specified', () => {
//       let discovery = new Discovery();
//       let method = discovery.resolveMethod({ kind: 'boot' });
//       assert(method instanceof DiscoveryMethod);
//       assert(method instanceof Boot);
//     });
//   });

//   describe('#discover()', () => {
//     it('map and reduce result from all method discover function', async () => {
//       let method1 = new DiscoveryMethod({ kind: 'foo' });
//       let stub1 = sinon.stub(method1, 'discover');
//       stub1.returns([ 1, 2 ]);
//       let method2 = new DiscoveryMethod({ kind: 'bar' });
//       let stub2 = sinon.stub(method2, 'discover');
//       stub2.returns([ 3, 4, 5 ]);
//       let methods = [ method1, method2 ];
//       let discovery = new Discovery({ methods });
//       let result = await discovery.discover();
//       assert(stub1.called);
//       assert(stub2.called);
//       assert.equal(result.length, 5);
//       stub1.restore();
//       stub2.restore();
//     });
//   });
// });
