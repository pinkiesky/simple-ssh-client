const net = require('net');
const fwdLocalDebug = require('debug')('ssh:forwarding:local');
const fwdRemoteDebug = require('debug')('ssh:forwarding:remote');


module.exports = function forwardTCP(sshConn, srcHost, srcPort, dstHost, dstPort, cb) {
  const server = net.createServer((sock) => {
    fwdLocalDebug('connected: %s:%s', sock.remoteAddress, sock.remotePort);

    sshConn.forwardOut(srcHost, srcPort, dstHost, dstPort, (err, stream) => {
      if (err) {
        fwdRemoteDebug('failed to connect: %s', err.message);
        console.error(err);

        sock.end();
        return;
      }

      fwdRemoteDebug('connected');

      stream.on('data', (data) => {
        try {
          sock.write(data);
        } catch (ignore) {
          // must catch Socket.writeAfterFIN error
        }
      });
      sock.on('data', (data) => {
        try {
          stream.write(data);
        } catch (ignore) {
          // must catch Socket.writeAfterFIN error
        }
      });

      stream.on('close', () => {
        fwdRemoteDebug('close');
        sock.end();
      });

      sock.on('close', () => {
        fwdLocalDebug('close');
        stream.end();
      });
    });
  });

  server.listen(srcPort, srcHost, () => {
    fwdLocalDebug('tcp server started on %s:%d', srcHost, srcPort);
    cb(null, server);
  });
};
