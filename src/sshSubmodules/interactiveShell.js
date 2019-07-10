const shellDebug = require('debug')('ssh:shell');
const AcpDataFinder = require('../acp/AcpDataFinder');
const AcpCommandInterpreter = require('../acp/AcpCommandInterpreter');
const PlainTextCommandInterpreter = require('../PlainTextCommandInterpreter');
const resources = require('../resources');
const AnsiTextPrefixFinder = require('../AnsiTextPrefixFinder');
const ANSI = require('../ANSI');


function commandHandler(stream, ansiDataTextFinder, cmdInterpreter) {
  return (value) => {
    stream.pause();
    resources.release(stream, ansiDataTextFinder);

    cmdInterpreter.interpr(value, (error) => {
      if (error) {
        shellDebug('error: command "%s" failed: %s', value.command, error.message);
        console.error(error);
      }

      resources.grab(stream, ansiDataTextFinder);
      stream.resume();
      stream.write(String.fromCharCode(ANSI.ctrl_c));
    });
  };
}

module.exports = function forwardTCP(sshConn, cb) {
  sshConn.shell({ term: process.env.TERM || 'vt100' }, (err, stream) => {
    if (err) {
      cb(err);
      return;
    }

    cb(null, stream);

    shellDebug('open');

    const plainCmdInterpreter = new PlainTextCommandInterpreter(sshConn);
    const ansiDataTextFinder = new AnsiTextPrefixFinder({ prefixes: ['get ', 'put '] });
    ansiDataTextFinder
      .on('find', commandHandler(stream, ansiDataTextFinder, plainCmdInterpreter))
      .pipe(stream);

    const cmdInterpreter = new AcpCommandInterpreter(sshConn);
    const sf = new AcpDataFinder();
    sf.on('acp', commandHandler(stream, ansiDataTextFinder, cmdInterpreter));

    stream.pipe(sf);
    resources.grab(stream, ansiDataTextFinder);

    stream.on('close', () => {
      shellDebug('close');
      resources.release(stream, ansiDataTextFinder);
      sshConn.end();
    });
  });
};
