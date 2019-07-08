const resourcesDebug = require('debug')('system:resources');


module.exports = {
  grab(shellStream) {
    resourcesDebug('grab');

    process.stdin.setRawMode(true);
    shellStream.pipe(process.stdout);
    process.stdin.pipe(shellStream);
  },
  release(shellStream) {
    shellStream.unpipe(process.stdout);
    process.stdin.unpipe(shellStream);
    process.stdin.unref();
    process.stdin.setRawMode(false);

    resourcesDebug('release');
  },
};
