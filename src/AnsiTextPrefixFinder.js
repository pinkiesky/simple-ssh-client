const { Transform } = require('stream');
const ANSI = require('./ANSI');


const FINDER_STATE = {
  waitEsc: 0,
  waitCsi: 1,
  readFinalByte: 3,
};

const BYTE_STATUS = {
  pass: 0,
  grab: 1,
  grabNoThrough: 2,
  escEnd: 3,
};


class AnsiTextPrefixFinder extends Transform {
  /**
   * @param {object} options
   * @param {Array.<string>} prefixes
   */
  constructor(options) {
    super(options);
    if (!options || !options.prefixes || !options.prefixes.length) {
      throw new Error('Usage error: prefixed cannot be empty');
    }
    this.prefixes = options.prefixes;

    this.finderState = FINDER_STATE.waitEsc;

    this.textBuffer = [];
    this.textBufferPosition = 0;

    this.lastCsiData = {
      finalByte: null,
    };
  }

  setBufferPosition(newBP) {
    this.textBufferPosition = Math.max(0, newBP);
    this.textBufferPosition = Math.min(this.textBufferPosition, this.textBuffer.length);
  }

  moveBufferPosition(positionOffset) {
    this.setBufferPosition(this.textBufferPosition + positionOffset);
  }

  get assembledTextBuffer() {
    return this.textBuffer.join('').trimLeft();
  }

  // eslint-disable-next-line no-underscore-dangle
  _transform(chunk, encoding, callback) {
    chunk.forEach((b) => {
      const byteStatusEscBuffer = this.handleEscBuffer(b);
      if (byteStatusEscBuffer === BYTE_STATUS.grab) {
        this.push(String.fromCharCode(b));
        return;
      }

      if (byteStatusEscBuffer === BYTE_STATUS.escEnd) {
        const byteStatusEsc = this.handleEsc();
        if (byteStatusEsc === BYTE_STATUS.grab) {
          this.push(String.fromCharCode(b));
          return;
        }
      }

      const byteStatusText = this.handleTextBuffer(b);
      if (byteStatusText === BYTE_STATUS.grabNoThrough) {
        return;
      }

      this.push(String.fromCharCode(b));
    });

    callback();
  }

  handleEscBuffer(b) {
    switch (this.finderState) {
      case FINDER_STATE.waitEsc:
        if (b === ANSI.esc) {
          this.finderState = FINDER_STATE.waitCsi;
          return BYTE_STATUS.grab;
        }
        break;

      case FINDER_STATE.waitCsi:
        if (b === ANSI.cursorInChange) {
          this.finderState = FINDER_STATE.readFinalByte;
          return BYTE_STATUS.grab;
        }

        this.finderState = FINDER_STATE.waitEsc;
        break;

      case FINDER_STATE.readFinalByte:
        this.lastCsiData.finalByte = b;
        this.finderState = FINDER_STATE.waitEsc;
        return BYTE_STATUS.escEnd;

      default:
        break;
    }

    return BYTE_STATUS.pass;
  }

  handleEsc() {
    const { finalByte } = this.lastCsiData;

    if (finalByte === ANSI.cursorBack) {
      this.moveBufferPosition(-1);
    }

    if (finalByte === ANSI.cursorForward) {
      this.moveBufferPosition(1);
    }

    return BYTE_STATUS.grab;
  }

  handleTextBuffer(b) {
    if (b === ANSI.ctrl_c) {
      this.resetTextBuffer();
      return BYTE_STATUS.pass;
    }

    if (b === ANSI.nl || b === ANSI.cr) {
      const prefix = this.isBufferHasValueForFind();
      if (prefix) {
        this.emit('find', this.assembledTextBuffer);
        this.resetTextBuffer();
        return BYTE_STATUS.grabNoThrough;
      }

      this.resetTextBuffer();
      return BYTE_STATUS.pass;
    }

    if (b === ANSI.tab && this.isBufferHasValueForFind()) {
      return BYTE_STATUS.grabNoThrough;
    }

    if (b === ANSI.delete) {
      this.textBuffer.splice(this.textBufferPosition - 1, 1);
      this.moveBufferPosition(-1);
      return BYTE_STATUS.pass;
    }

    this.textBuffer.splice(this.textBufferPosition, 0, String.fromCharCode(b));
    this.moveBufferPosition(1);
    return BYTE_STATUS.pass;
  }

  isBufferHasValueForFind() {
    const str = this.assembledTextBuffer;
    const prefix = this.prefixes.find(s => str.startsWith(s));
    return prefix;
  }

  resetTextBuffer() {
    this.textBuffer.length = 0;
    this.setBufferPosition(0);
  }
}

module.exports = AnsiTextPrefixFinder;
