const { Peer } = require('../peer');
(() => {
  let peers = [];
  for (let i = 0; i < 10000000; i++) {
    let peer = new Peer('http://foo.bar/' + i);
    peers.push(peer);
  }

  console.log(process.memoryUsage())
  console.log('peers added');

  setTimeout(() => {
    console.log('done');
  }, 100000);
})();
