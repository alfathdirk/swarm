const os = require('os');

module.exports = function getIps () {
  let ifaces = os.networkInterfaces();
  let result = [];
  Object.values(ifaces).forEach(iface => {
    iface.forEach(ip => {
      if (ip.family === 'IPv6') return;
      result.push(ip.address);
    });
  });

  return result;
};
