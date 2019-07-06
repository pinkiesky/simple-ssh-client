const { Client } = require('ssh2');
const clientDebug = require('debug')('ssh:client');
const { parseArgsSync, usage } = require('../src/parseArgs');
const interactiveShell = require('../src/sshSubmodules/interactiveShell');


let args;
try {
  args = parseArgsSync(process.argv);
} catch (err) {
  console.error('Argument parsing error', err.message);
  console.error('Usage: ', usage);
  process.exit(1);
}

clientDebug('connecting to %s', args.url.href);

const conn = new Client();
conn.on('ready', () => {
  clientDebug('ready');

  interactiveShell(conn, (err) => {
    if (err) {
      console.error('cannot open interactive shell with remote host:', err.message);
    }
  });
}).on('error', (err) => {
  clientDebug('error: %s', err.message);
  console.error(err);
}).on('end', () => {
  clientDebug('end');
}).connect({
  host: args.url.host,
  port: args.url.port || 22,
  username: args.url.username || process.env.USER,
  password: args.url.password,
  privateKey: args.privateKey,
});
