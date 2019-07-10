/* eslint-disable no-console */
const CommandInterpreter = require('../CommandInterpreter');


class AcpCommandInterpreter extends CommandInterpreter {
  constructor(sshConnection) {
    super(sshConnection);
    this.apiVersion = 'ssc-v1';
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
}

module.exports = AcpCommandInterpreter;
