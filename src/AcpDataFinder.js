const { Transform } = require('stream');
const acpDataParser = require('../src/acpDataParser');


const ANSI = {
  esc: 0x1B,
  apc: 0x9F,
  st: 0x9C,
};

const FINDER_STATE = {
  waitEsc: 0,
  waitApc: 1,
  readString: 2,
};

class AcpDataFinder extends Transform {
  /**
   * @param {object} options
   * @param {number} apcBufferMaxSize=512
   */
  constructor(options = { apcBufferMaxSize: 512 }) {
    super(options);

    this.apcDataBuffer = new Uint8Array(options.apcBufferMaxSize);
    this.apcDataBufferPosition = 0;

    this.finderState = FINDER_STATE.waitEsc;
  }

  // eslint-disable-next-line no-underscore-dangle
  _transform(chunk, encoding, callback) {
    chunk.forEach((p) => {
      switch (this.finderState) {
        case FINDER_STATE.waitEsc:
          if (p === ANSI.esc) {
            this.finderState = FINDER_STATE.waitApc;
          }
          break;

        case FINDER_STATE.waitApc:
          this.finderState = p === ANSI.apc
            ? FINDER_STATE.readString
            : FINDER_STATE.waitEsc;
          break;

        case FINDER_STATE.readString:
          if (p === ANSI.st) {
            const data = this.apcDataBuffer.slice(0, this.apcDataBufferPosition);
            const acp = acpDataParser(data);
            this.emit('acp', acp);

            this.resetFinderState();
          } else {
            this.appendToDataBuffer(p);
          }
          break;

        default:
          break;
      }
    });

    callback(null, chunk);
  }

  appendToDataBuffer(data) {
    this.apcDataBuffer[this.apcDataBufferPosition] = data;
    this.apcDataBufferPosition += 1;
  }

  resetFinderState() {
    this.finderState = FINDER_STATE.waitEsc;
    this.apcDataBufferPosition = 0;
  }
}

module.exports = AcpDataFinder;
