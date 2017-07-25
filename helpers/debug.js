function padStart (s, n, p) {
  let d = n - s.length;
  if (d > 0) {
    for (let i = 0; i < d; i++) {
      s = p + s;
    }
  } else {
    s = s.substr(0, n);
  }
  return s;
}

function padEnd (s, n, p) {
  let d = n - s.length;
  if (d > 0) {
    for (let i = 0; i < d; i++) {
      s = s + p;
    }
  } else {
    s = s.substr(0, n);
  }
  return s;
}

function debug (id, ...args) {
  if (debug.disabled) {
    return;
  }
  let d = new Date();
  let time = `${padStart(d.getHours().toString(), 2, '0')}:${padStart(d.getMinutes().toString(), 2, '0')}:${padStart(d.getSeconds().toString(), 2, '0')}.${padStart(d.getMilliseconds().toString(), 3, '0')}`;
  let messages = [ time, `[${padEnd(id, 15, ' ')}]`, ...args ];

  console.info(...messages);
};

debug.disabled = false;

module.exports = debug;
