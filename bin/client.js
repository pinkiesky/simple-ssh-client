const { Client } = require('ssh2');
const clientDebug = require('debug')('ssh:client');
const shellDebug = require('debug')('ssh:shell');
const resourcesDebug = require('debug')('system:resources');
const parseArgs = require('../src/parseArgs');
const AcpDataFinder = require('../src/AcpDataFinder');


const resources = {
  grab(shellStream) {
    resourcesDebug('grab');

    process.stdin.setRawMode(true);
    shellStream.pipe(process.stdout);
    process.stdin.pipe(shellStream);
  },
  release(shellStream) {
    resourcesDebug('release');

    shellStream.unpipe(process.stdout);
    process.stdin.unpipe(shellStream);
    process.stdin.setRawMode(false);
  },
};

const { url } = parseArgs(process.argv);

clientDebug('connecting to %s', url.href);

const decoder = new TextDecoder();

const conn = new Client();
conn.on('ready', () => {
  clientDebug('ready');
  conn.shell({ term: process.env.TERM || 'vt100' }, (err, stream) => {
    if (err) throw err;
    shellDebug('open');

    const sf = new AcpDataFinder();
    sf.on('data', (value) => {
      stream.pause();
      resources.release(stream);

      console.log('new string from server', decoder.decode(value));

      resources.grab(stream);
      stream.resume();
    });
    stream.pipe(sf);

    resources.grab(stream);

    stream.on('close', () => {
      shellDebug('close');
      resources.release(stream);
      conn.end();
    });
  });
}).on('error', (err) => {
  clientDebug('error: %s', err.message);
  console.error(err);
}).on('end', () => {
  clientDebug('end');
}).connect({
  host: url.host,
  port: url.port || 22,
  username: url.username || process.env.USER,
  password: url.password,
});
