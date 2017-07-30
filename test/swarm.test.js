const assert = require('assert');
const sinon = require('sinon');
const { Swarm } = require('../swarm');
const { Peer } = require('../peer');
const { Channel } = require('../channel');
const Tcp = require('../channel/tcp');

const PRIV_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA1cCxMnwhcp9R2hqfm/5HHg1h1Xwd6lFXBSNiKAOvMZuJPVlI
2WMJq+HG7K6dLtaYUzjmYm0VU78AfYd4/vFZdzchP4xrY/KpTxzpIUu+N/DzgamD
jxzGAkb5Wn2qZSh+wUbrJYCb5o/2emfnni2w1Aob/EeF4bgaUVBh/bYZyZwfu0qw
QSgtLTutiYLtVayfZG+O55nE5DEgE+rRlPxkTVqdjE1FiA4VF+FtctfFSPrevTt6
LPqyP2lNPUjEqo5e69Okmgdd9ZdBo3LqzhLyYbFtfcobZLzjX+OOgI4SlXxH3Drq
IwRlj8Z2NhgVVh/1Ch+BMudPk9HJ+KOKGIv0kQIDAQABAoIBAAidIEbpi6uD0heY
9Q+jOphyb5vbyZTUvE3/tAfqxheYrfoj6/SeshgUHCETlE/7492OsHIM9UwPqWRl
njGf5jwQo61c6kL312zRvG9UDxFQC3ARNbUBstUKqSfFYqV68Ui2o+k5+o5bBNK/
9yx/qN2SnrgW5cVH1v+p3pkLypQ+PHfrJXRooC+ycmnYC7FX7+K4ZJPyBtSFcY8q
jeBFRi6VYSR/5wFHgMkagyQ09A3a7CcjHJPKLjzcl3Myr/lPIpKv6Ah6We9eWZtj
/TGP0xmy0nFreRfpmVao7GZW6h80WlI5q1N0E5FodcMG1TLmCHI9FICNPmoupLGu
wwJyKyUCgYEA/25CEb0pEvAlrWrCOU082voT6/Kv61ZFACk2WKaZ7LDu89TF4Q+n
52XBNtyLVrSUieQSfrHelJIXtMSfwDoDCaqmSIO/9HZAPiLjWXdCYUtWGH3lKf/F
Z0RS6it2S8bzadn0Ul7fJBgCVJUJBWIEqnSirT7ifA5zSXy2BRkCcEcCgYEA1jqn
W/c99E549VUWb9nx1D+uMc2Y1eotD90flEiEizSNCNHj6h+PLMO9H7z3M9tbYJJG
xLkrn16HXPmRWVpu2J2zo5YYpn7T3aBk3E/VcjZBVxvRs1HmmBihskPnwAKKqHIj
KKtKq3cujBx+apymjPTqYyitlv5V+9kiFkfU+GcCgYEAoL2oAjXB1VMewsT+OMUs
WLkrND5jCnwdq/5DXwJotxSZKwRpCjqp9OqJ7pZXcVbuauAF64jPgzt0g6OAzJ01
MC4dumB+ub54qyGVZMWyFjwsj/kZ75Yvic7rRsXXCdTHdYNdR0DAt5wMS2IGbUbD
nOkNPmzmZh9J2aMLgKW+bR0CgYEAuXT3c18brEbO4hvyG4yClOs4Avdoqy9aKVSV
RQpubBBnU85YT1NY4DjnnfU50BPDDFw1lZJ0GDh+WNfYo5DtSutjG2gSGPjMsx1q
k2stbf1YHXAA3ws05FDWknvEwe2xWdfNZiS7tKqtijAUpHjOmlJgIs2RUZkGmMtF
fiJbVVsCgYAK4auSQoHwCYHz0MN/Aax+t+LVJ+rBeRbWYz4b8PR1XntiLUT2uTUA
pniKsNRHrol6lA5nb2ye3i8Iiw7W6lquqaraKBYeJgH1YZyHrioZkdQvN8cwbYUl
gP8Fx4EYvnM2HOmouCnsKoR3BuElnpyXOsESiczOwlQQkZw8vnhMFg==
-----END RSA PRIVATE KEY-----`;

describe('Swarm', () => {
  describe('constructor', () => {
    it('define discovery instance', () => {
      let swarm = new Swarm();
      assert(swarm.discovery);
    });

    it('define max peers as number', () => {
      let swarm = new Swarm();
      assert.equal(typeof swarm.maxPeers, 'number');
    });

    it('define networkId', () => {
      let swarm = new Swarm();
      assert.equal(swarm.networkId, '0');
    });
  });

  describe('#start()', () => {
    it('read identity from storage', async () => {
      let swarm = new Swarm();
      let read = sinon.stub(swarm.storage, 'read');
      read.withArgs('privkey.pem').returns(PRIV_KEY);
      let exists = sinon.stub(swarm.storage, 'exists');
      exists.withArgs('privkey.pem').returns(true);
      await swarm.start();
      assert(read.called);
      read.restore();
      exists.restore();
    });

    it('init new identity when not exist', async () => {
      let swarm = new Swarm();
      let write = sinon.stub(swarm.storage, 'write');
      await swarm.start();
      assert(write.called);
      write.restore();
    });
  });
});
