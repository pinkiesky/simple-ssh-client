const shellDebug = require('debug')('ssh:shell');
const AcpDataFinder = require('../AcpDataFinder');
const AcpCommandInterpreter = require('../AcpCommandInterpreter');
const resources = require('../resources');


module.exports = function forwardTCP(sshConn, cb) {
  sshConn.shell({ term: process.env.TERM || 'vt100' }, (err, stream) => {
    if (err) {
      cb(err);
      return;
    }

    cb(null, stream);

    shellDebug('open');

    const cmdInterpreter = new AcpCommandInterpreter(sshConn);

    const sf = new AcpDataFinder();
    sf.on('acp', (value) => {
      stream.pause();
      resources.release(stream);

      cmdInterpreter.interpr(value, (error) => {
        if (error) {
          shellDebug('error: command "%s" failed: %s', value.command, error.message);
          console.error(error);
        }

        resources.grab(stream);
        stream.resume();
      });
    });
    stream.pipe(sf);

    resources.grab(stream);

    stream.on('close', () => {
      shellDebug('close');
      resources.release(stream);
      sshConn.end();
    });
  });
};
