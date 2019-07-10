const CommandInterpreter = require('./CommandInterpreter');


class PlainTextCommandInterpreter extends CommandInterpreter {
  interpr(textData, cb) {
    const [command, ...args] = textData
      .trim()
      .split(' ')
      .filter(s => s.length);

    const cmdFunction = this.availableCommands[command];
    if (!cmdFunction) {
      cb(new Error(`Unexpected command: ${command}`));
      return;
    }

    const normalizedArgs = new Array(cmdFunction.length - 1)
      .fill(undefined)
      .map((_, i) => args[i]);

    cmdFunction.call(this, ...normalizedArgs, cb);
  }
}

module.exports = PlainTextCommandInterpreter;
