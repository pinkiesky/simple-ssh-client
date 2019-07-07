const net = require('net');
const fwdLocalDebug = require('debug')('ssh:forwardingIn:local');
const fwdRemoteDebug = require('debug')('ssh:forwardingIn:remote');


module.exports = function forwardTCPIn(sshConn, srcHost, srcPort, dstHost, dstPort, cb) {
  sshConn.forwardIn(srcHost, srcPort, (err) => {
    cb(err);
  });

  sshConn.on('tcp connection', (info, accept, reject) => {
    fwdLocalDebug('connected');

    const client = net.createConnection({ host: dstHost, port: dstPort }, () => {
      const conn = accept();
      conn.on('close', () => {
        fwdLocalDebug('close');
        client.end();
      }).on('data', (data) => {
        client.write(data);
      });

      client.on('close', () => {
        fwdRemoteDebug('close');
        conn.end();
      }).on('data', (data) => {
        conn.write(data);
      });
    });

    client.on('error', (err) => {
      fwdRemoteDebug('remote connect error: %s', err.message);
      console.error(err);
      reject();
    });
  });
};
