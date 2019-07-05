const { URL } = require('url');


module.exports = function parseArgs(argv) {
  let rawUrl = null;

  argv.slice(2).forEach((arg) => {
    if (!arg.startsWith('-')) {
      rawUrl = arg;
    }
  });

  if (!rawUrl.startsWith('ssh://')) {
    rawUrl = `ssh://${rawUrl}`;
  }

  return {
    rawUrl,
    url: new URL(rawUrl),
  };
};
