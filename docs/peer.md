# Peer

a(peer):
  channels:
  - http
  - tcp
  - udp
  urls:
  - http://foo.bar:8888
  - udp://foo.bar:8889

http(channel):
  kind: http

## Initiate

peer:    dial peer by its url one by one until connect
peer:    each url use compatible channel to connect
channel: connect channel using url
channel: when connected do return session to peer
peer: session handshake

when connect:


> a.dial() => a.dial(http => http://foo.bar:8888)


## http.on(connect, socket)

create new peer after
