/* eslint-disable no-console */
const fs = require('fs');
const { join, basename } = require('path');


class AcpCommandInterpreter {
  constructor(sshConnection) {
    this.sshConnection = sshConnection;
    this.apiVersion = 'ssc-v1';

    this.availableCommands = {
      getFile: this.getFile,
      putFile: this.putFile,
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

      const localDest = join(localDir, fileName);
      console.info(`Downloading: ${this.sshConnection.config.host}:"${remoteFile}" ->  "${localDest}"`);

      sftp.createReadStream(remoteFile)
        .pipe(fs.createWriteStream(localDest))
        .on('error', cb)
        .on('finish', () => cb(null));
    });
  }

  putFile(localFile, remoteDir, cb) {
    const bname = basename(localFile);
    fs.stat(localFile, (statErr, stats) => {
      if (statErr) {
        cb(statErr);
        return;
      }

      if (!stats.isFile) {
        cb(new Error(`Not a regular file: ${localFile}`));
        return;
      }

      this.sshConnection.sftp((err, sftp) => {
        if (err) {
          cb(err);
          return;
        }

        const remoteDest = join(remoteDir || './', bname);
        console.info(`Uploading: ${localFile} -> ${this.sshConnection.config.host}:"${remoteDest}"`);

        fs.createReadStream(localFile)
          .pipe(sftp.createWriteStream(remoteDest))
          .on('error', cb)
          .on('finish', () => cb(null));
      });
    });
  }
}

module.exports = AcpCommandInterpreter;
