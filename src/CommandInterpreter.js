/* eslint-disable class-methods-use-this */
/* eslint-disable no-console */
const fs = require('fs');
const { join, basename } = require('path');


class CommandInterpreter {
  constructor(sshConnection) {
    if (new.target === CommandInterpreter) {
      throw new TypeError('Cannot construct CommandInterpreter instances directly');
    }

    this.sshConnection = sshConnection;
    this.availableCommands = {
      getFile: this.getFile,
      putFile: this.putFile,
      get: this.getFile,
      put: this.putFile,
    };
  }


  // eslint-disable-next-line no-unused-vars
  interpr(data, cb) {
    throw new Error('not implemented');
  }

  getFile(remoteFile, localDir, fileName, fileSize, cb) {
    this.sshConnection.sftp((err, sftp) => {
      if (err) {
        cb(err);
        return;
      }

      const localDest = join(localDir || './', fileName || basename(remoteFile));
      console.info(`Downloading: ${this.sshConnection.config.host}:"${remoteFile}" ->  "${localDest}"`);

      sftp.fastGet(remoteFile, localDest, cb);
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
        sftp.fastPut(localFile, remoteDest, cb);
      });
    });
  }
}

module.exports = CommandInterpreter;
