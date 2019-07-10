const minimist = require('minimist');
const fs = require('fs');
const { URL } = require('url');

/**
 * @param {string|null} arg str with format `[bind_address:]port:host:hostport`
 */
function tcpForwardingParse(arg) {
  const tcpForwarding = {
    enabled: false,
    srcHost: null,
    srcPort: null,
    dstHost: null,
    dstPort: null,
  };

  if (!arg) {
    return tcpForwarding;
  }

  tcpForwarding.enabled = true;

  const tcpFData = arg.split(':');
  if (tcpFData.length === 3) {
    tcpFData.unshift('localhost');
  } else if (tcpFData.length !== 4) {
    throw new Error(`Usage error: wrong tcpForwarding value: ${arg}`);
  }

  const [srcHost, srcPort, dstHost, dstPort] = tcpFData;
  Object.assign(tcpForwarding, {
    srcHost, srcPort, dstHost, dstPort,
  });

  return tcpForwarding;
}

function parseArgsSync(argv) {
  const args = minimist(argv.splice(2), {
    boolean: ['v', 'j'],
  });

  let rawUrl = args._[0];
  if (!rawUrl || !rawUrl.length) {
    throw new Error('Usage error: missing `destination` args');
  }

  if (!rawUrl.startsWith('ssh://')) {
    rawUrl = `ssh://${rawUrl}`;
  }

  const tcpForwarding = tcpForwardingParse(args.L);
  const tcpForwardingIn = tcpForwardingParse(args.R);

  let privateKey = null;
  if (args.i) {
    privateKey = fs.readFileSync(args.i, { encoding: 'utf8' });
  }

  return {
    rawUrl,
    url: new URL(rawUrl),
    tcpForwarding,
    tcpForwardingIn,
    privateKey,
    debug: !!args.v,
    injectHostUtils: !!args.j,
  };
}

module.exports = {
  parseArgsSync,
  usage: `${process.argv[0]} ${process.argv[1]} [-L [bind_address:]port:host:hostports] [-R [bind_address:]port:host:hostports] destination`,
};
