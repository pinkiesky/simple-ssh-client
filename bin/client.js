#!/usr/bin/node

const { Client } = require('ssh2');
const debug = require('debug');
const clientDebug = require('debug')('ssh:client');
const { parseArgsSync, usage } = require('../src/parseArgs');
const interactiveShell = require('../src/sshSubmodules/interactiveShell');
const forwardTCP = require('../src/sshSubmodules/forwardTCP');
const forwardTCPIn = require('../src/sshSubmodules/forwardTCPIn');
const injectHostUtils = require('../src/sshSubmodules/injectHostUtils');
require('../src/handleInternalTCPError');

debug.formatArgs = function formatArgs(args) { // requires access to "this"
  const time = new Date().toLocaleTimeString();
  // eslint-disable-next-line no-param-reassign
  args[0] = ` [${time}] ${this.namespace} ${args[0]};`;
};

let args;
try {
  args = parseArgsSync(process.argv);
} catch (err) {
  console.error('Argument parsing error', err.message);
  console.error('Usage: ', usage);
  process.exit(1);
}

if (args.debug) {
  debug.enable('*');
}

clientDebug('connecting to %s', args.url.href);

const conn = new Client();
conn.on('ready', () => {
  clientDebug('ready');

  if (args.tcpForwarding.enabled) {
    const {
      srcHost,
      srcPort,
      dstHost,
      dstPort,
    } = args.tcpForwarding;
    forwardTCP(conn, srcHost, srcPort, dstHost, dstPort, (err) => {
      if (err) {
        console.error('cannot forward tcp:', err.message);
      }
    });
  }

  if (args.tcpForwardingIn.enabled) {
    const {
      srcHost,
      srcPort,
      dstHost,
      dstPort,
    } = args.tcpForwardingIn;
    forwardTCPIn(conn, srcHost, srcPort, dstHost, dstPort, (err) => {
      if (err) {
        console.error('cannot forward tcp:', err.message);
      }
    });
  }

  interactiveShell(conn, (err, stream) => {
    if (err) {
      console.error('cannot open interactive shell with remote host:', err.message);
    }

    if (args.injectHostUtils) {
      injectHostUtils(conn, stream, (injErr) => {
        if (err) {
          console.error(`Cannot inject: ${injErr.message}`);
        }
      });
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
