const resourcesDebug = require('debug')('system:resources');


module.exports = {
  grab(shellStream, toStdin) {
    resourcesDebug('grab');

    process.stdin.setRawMode(true);
    shellStream.pipe(process.stdout);
    process.stdin.pipe(toStdin);
  },
  release(shellStream, toStdin) {
    shellStream.unpipe(process.stdout);
    process.stdin.unpipe(toStdin);
    process.stdin.unref();
    process.stdin.setRawMode(false);

    resourcesDebug('release');
  },
};
