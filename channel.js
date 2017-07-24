const { EventEmitter } = require('events');

/**
 * Channel must implements these methods:
 * - up
 * - down
 * - connect
 */
class Channel extends EventEmitter {

}

module.exports = { Channel };
