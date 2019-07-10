module.exports = {
  esc: 0x1B,
  apc: 0x9F,
  csi: 0x9B,
  st: 0x9C,

  cursorInChange: 0x4F,
  cursorForward: 'C'.charCodeAt(0),
  cursorBack: 'D'.charCodeAt(0),

  delete: 127,

  tab: '\t'.charCodeAt(0),
  nl: '\n'.charCodeAt(0),
  cr: '\r'.charCodeAt(0),
  ctrl_c: 3,
};
