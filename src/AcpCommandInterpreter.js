const { createWriteStream } = require('fs');
const { join } = require('path');


class AcpCommandInterpreter {
  constructor(sshConnection) {
    this.sshConnection = sshConnection;
    this.apiVersion = 'ssc-v1';

    this.availableCommands = {
      getFile: this.getFile,
    };
  }

  interpr(acpData, cb) {
    if (this.apiVersion !== acpData.apiVersion) {
      cb(new Error(`Wrong acp data version: ${acpData.apiVersion}`));
      return;
    }

    const cmdFunction = this.availableCommands[acpData.command];
    if (!cmdFunction) {
      cb(new Error(`Unexpected command: ${acpData.command}`));
      return;
    }

    cmdFunction.call(this, ...acpData.args, cb);
  }

  getFile(remoteFile, fileName, fileSize, localDir, cb) {
    this.sshConnection.sftp((err, sftp) => {
      if (err) {
        cb(err);
        return;
      }

      sftp.createReadStream(remoteFile)
        .pipe(createWriteStream(join(localDir, fileName)))
        .on('error', cb)
        .on('finish', () => cb(null));
    });
  }
}

module.exports = AcpCommandInterpreter;
