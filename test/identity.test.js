const assert = require('assert');
const sha3256 = require('js-sha3').sha3_256;
const { Identity } = require('../identity');

const ALICE_PRIV_KEY = `-----BEGIN RSA PRIVATE KEY-----
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

const BOB_PRIV_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAnEHNVx7CpJ8Ys/BmRGV43JwS367dkgBJ/BaHxw9eiG8ZmQIl
yWvVUVKMt6QWOzeAcQy/INFtPMMqUGSSmCOkYMjHkzm8pa9Iz/SYjl7mhdCulxlM
jOBv/RKAZN3gq/SdBTAYta0UuGSAB3aI/3GS2MKIrXXUnsQUiB1Qh6fhrPAZ+Q3W
3F8NVCVXJ5PNIv3VStFKNp3gkRcR9qdca+Fma3ye01WxY+gwejBBApmwF84XTIXY
pwmZ+zARemofz/u+m+fixYyUGEN22ICo+IJCYxlnE+lYyeglv/dkoRd0MX4KaHdX
efvhM+Gkcm3wWqppqPq7DFyeuENd5L5EwWvEYQIDAQABAoIBADPyICx1Omn1xgWT
xru4LBzS+edIv7oYxH+8kbjYYCnlHVJjh2JVqd3WHpeyQf2/rsBmZ2eml7UagIen
V6CiQLQ4KzjDefZutjsD6m9yFxqnTFNJAszWlARC0VI2/MjNkiG2YpCLEJdYOcPB
YTviatoKmdtoj52UO+sgK7RdWEXgKwinUP5tmpeFfR9ZbOBohzG4CtrQ2Z/EkGBB
oNNgxMtmzbLrhOybRu0NLYThqggHTg1mwCctEVEzVx1YuZ4XxW3PwDPVVidZdCf+
nd/n1hM+iz5Eud5FAS2QxUnaY2nzYtvGy+TLXrdpW38yxosAHER61t5/+1yZLzRO
BJ9VUm0CgYEAzfXS7/eszLDvdVYIqWYJZcK6ead3ejTwjGMcdQ5XmZ/uvzFzDFly
6117h5hWoTKJq88J1YSRYnBK1QiQ7E1XBH8ev5LlOnaBK3E51BF0qJq1Do7nAzSi
cmWNuYZARl2tT5WRqquNJOiXAj5BtEFGTgZ5A4JQlyAvyI9IoRk2n8cCgYEAwjiS
ULTLtvu8J6zIXeo5KrVNAuL6lxecGoXmkMdUVbqmhi6RKM4ncU/vbtYaOj7SoXZC
qkTxHrYdzywW/twyx6dLSB8kZSaTQ7yw5s25JxzDKd+vaXzkaoHn0cdoHRpdjqo4
57Dpw90fGbg0rKT/lRzG+tcJGwKbxQWXX+/cSpcCgYBHg6fusu1JVdaPw4PWbhut
PeRKAaA2ytMLrA5hhs1cBnB76sur6hNBLoCKIJdT+ZxcD9O2VAW3TI5vUj4gDuq8
IPeoRXVay3MmhnYx8K21LaLYnz4PmuMdHa4MUVVYGYboL2MZA+BKhIiKuttNn6yt
wwmZ8lHRZ9evqDDr3zlcWQKBgQCoQ26vsRLUot9t2Al3I9cHIy9nEtJbWD8L03nf
cHGmHCDtGybznTcaulALTD5Iu+irrdMvxK7JFqpYtC/v+UGdK1jTUPetEnB/PNhd
/Vktg4OpoXtM/sC9bXIzknimzhLD6MGIKQM9hzLMi4RHFmO/AcF5zBa9adMeLCvr
F9lYXQKBgFJiZ9utE2cDENGaq5zuT5eUNyEmX6FvRXV1h07AGUEpUVcLSB1FpjWh
8C0Iyd7MDBSs3ZEmmY39CmNGtEu227e9IvXLmwDCPUYwcPcSvmN+2XiBGVvv75cX
lqflyRUrUtW4zOjLCBe1GraNEeYCjyrrGo4zD2xLoE4ztN39OxB2
-----END RSA PRIVATE KEY-----`;

const ALICE_PUB_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1cCxMnwhcp9R2hqfm/5H
Hg1h1Xwd6lFXBSNiKAOvMZuJPVlI2WMJq+HG7K6dLtaYUzjmYm0VU78AfYd4/vFZ
dzchP4xrY/KpTxzpIUu+N/DzgamDjxzGAkb5Wn2qZSh+wUbrJYCb5o/2emfnni2w
1Aob/EeF4bgaUVBh/bYZyZwfu0qwQSgtLTutiYLtVayfZG+O55nE5DEgE+rRlPxk
TVqdjE1FiA4VF+FtctfFSPrevTt6LPqyP2lNPUjEqo5e69Okmgdd9ZdBo3LqzhLy
YbFtfcobZLzjX+OOgI4SlXxH3DrqIwRlj8Z2NhgVVh/1Ch+BMudPk9HJ+KOKGIv0
kQIDAQAB
-----END PUBLIC KEY-----`;

const BOB_PUB_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnEHNVx7CpJ8Ys/BmRGV4
3JwS367dkgBJ/BaHxw9eiG8ZmQIlyWvVUVKMt6QWOzeAcQy/INFtPMMqUGSSmCOk
YMjHkzm8pa9Iz/SYjl7mhdCulxlMjOBv/RKAZN3gq/SdBTAYta0UuGSAB3aI/3GS
2MKIrXXUnsQUiB1Qh6fhrPAZ+Q3W3F8NVCVXJ5PNIv3VStFKNp3gkRcR9qdca+Fm
a3ye01WxY+gwejBBApmwF84XTIXYpwmZ+zARemofz/u+m+fixYyUGEN22ICo+IJC
YxlnE+lYyeglv/dkoRd0MX4KaHdXefvhM+Gkcm3wWqppqPq7DFyeuENd5L5EwWvE
YQIDAQAB
-----END PUBLIC KEY-----`;

describe('Identity', () => {
  describe('constructor', () => {
    it('accept private key as parameter', () => {
      let identity = new Identity(ALICE_PRIV_KEY);
      assert(identity.key.isPrivate());
      assert.equal(identity.key.exportKey('private'), ALICE_PRIV_KEY);
      assert.equal(identity.key.exportKey('public'), ALICE_PUB_KEY);
    });

    it('accept public key as parameter', () => {
      let identity = new Identity(ALICE_PUB_KEY, 'mock-address');
      assert(identity.key.isPublic());
      assert(identity.key.exportKey('public'), ALICE_PUB_KEY);
      assert.throws(() => {
        identity.key.exportKey('private');
      });
    });

    it('create instance with generated key when parameter unspecified', () => {
      let identity = new Identity();
      assert(identity.key.exportKey('public'));
    });
  });

  describe('#address', () => {
    it('return identity address', () => {
      let identity = new Identity(ALICE_PRIV_KEY);
      assert.equal(identity.address, sha3256(ALICE_PRIV_KEY).slice(-20));
    });
  });

  describe('#publicKey', () => {
    it('return public key', () => {
      let identity = new Identity(ALICE_PRIV_KEY);
      assert.equal(identity.publicKey, ALICE_PUB_KEY);
    });
  });

  describe('encrypt, sign, decrypt, verify', () => {
    it('return encrypted data', () => {
      let bobPriv = new Identity(BOB_PRIV_KEY);
      let bobPub = new Identity(BOB_PUB_KEY, 'mock');
      let alicePriv = new Identity(ALICE_PRIV_KEY);
      let alicePub = new Identity(ALICE_PUB_KEY, 'mock');
      let msg = JSON.stringify({
        message: 'IT’S A SECRET TO EVERYBODY.',
      });

      let enc = alicePub.encrypt(msg, undefined, 'utf8');
      let sig = bobPriv.sign(enc);
      let rcv = alicePriv.decrypt(enc, 'utf8');
      let verified = bobPub.verify(enc, sig);
      assert.equal(rcv, msg);
      assert(verified);
    });
  });
});
