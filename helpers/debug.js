function debug (id, ...args) {
  if (debug.disabled) {
    return;
  }
  let d = new Date();
  let time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${d.getMilliseconds().toString().padStart(3, '0')}`;
  let messages = [ time, `[${id.substr(0, 15).padEnd(15)}]`, ...args ];

  console.info(...messages);
};

debug.disabled = false;

module.exports = debug;
