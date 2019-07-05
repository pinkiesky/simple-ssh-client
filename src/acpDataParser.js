const SEPARATOR = ' ; ';

const decoder = new TextDecoder();

/**
 * @typedef {Object} AcpData
 * @property {string} apiVersion
 * @property {number} command
 * @property {Array} args
 */

/**
 * @param  {string|buffer} rawData
 * @return {AcpData}
 */
module.exports = function acpDataParser(rawData) {
  const stringData = rawData instanceof Uint8Array
    ? decoder.decode(rawData)
    : rawData;
  const [apiVersion, command, ...args] = stringData.split(SEPARATOR);

  return {
    apiVersion, command, args,
  };
};
