const { join } = require('path');


const REMOTE_INJECT_PATH = '/tmp/inject-host-utils';
const HOST_UTILS_LOCAL_DIR = join(__dirname, '../../hostUtils');
// FIXME fs.readdir
const UTILS_LIST = ['acp.sh', 'getFile', 'putFile'];


module.exports = function injectHostUtils(sshConnection, shellConn, cb) {
  shellConn.write(` mkdir -p ${REMOTE_INJECT_PATH}; PATH=$PATH:${REMOTE_INJECT_PATH}\n`);

  sshConnection.sftp((err, sftp) => {
    if (err) {
      cb(err);
      return;
    }

    UTILS_LIST.forEach((name) => {
      sftp.fastPut(
        join(HOST_UTILS_LOCAL_DIR, name),
        join(REMOTE_INJECT_PATH, name),
        { mode: 0o755 },
        (putErr) => {
          if (putErr) {
            console.error(`Cannot inject '${name}': ${putErr.message}`);
          }
        },
      );
    });

    cb(null);
  });
};
