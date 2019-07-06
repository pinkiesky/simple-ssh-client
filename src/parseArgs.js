const minimist = require('minimist');
const fs = require('fs');
const { URL } = require('url');


function parseArgsSync(argv) {
  const args = minimist(argv.splice(2));

  let rawUrl = args._[0];
  if (!rawUrl || !rawUrl.length) {
    throw new Error('Usage error: missing `destination` args');
  }

  if (!rawUrl.startsWith('ssh://')) {
    rawUrl = `ssh://${rawUrl}`;
  }

  const tcpForwarding = {
    enabled: false,
    srcHost: null,
    srcPort: null,
    dstHost: null,
    dstPort: null,
  };
  if (args.L) {
    tcpForwarding.enabled = true;

    const tcpFData = args.L.split(':');
    if (tcpFData.length === 3) {
      tcpFData.unshift('localhost');
    } else if (tcpFData !== 4) {
      throw new Error(`Usage error: wrong tcpForwarding value: ${args.L}`);
    }

    const [srcHost, srcPort, dstHost, dstPort] = tcpFData;
    Object.assign(tcpForwarding, {
      srcHost, srcPort, dstHost, dstPort,
    });
  }

  let privateKey = null;
  if (args.i) {
    privateKey = fs.readFileSync(args.i, { encoding: 'utf8' });
  }

  return {
    rawUrl,
    url: new URL(rawUrl),
    tcpForwarding,
    privateKey,
  };
}

module.exports = {
  parseArgsSync,
  usage: `${process.argv[0]} ${process.argv[1]} [-L [bind_address:]port:host:hostports] destination`,
};
