'use strict';

const {
  toBN,
  padLeft,
  toDecimal
} = require('web3-utils');

const addHexPrefix = (s) => s.substr(0, 2) === '0x' ? s : '0x' + s;

const VALIDITY_ID_PREFIX = '0xffcc';
const SALT_FACTOR = toBN('0x7dee20b84b88'); // keccak("ValidityID")[0, 6]
const BLOCK_NO_MASK = toBN('0xffffffff');
const ADDRESS_MASK = toBN('0xffffffffffffffffffffffffffffffffffffffff');
const CBC_MASK = toBN('0xffffffffffffffffffffffffffffff');

const _idToData = (id) => toBN(addHexPrefix(addHexPrefix(id).substr(6)));

const _computeFlippedValue = (data) => data.xor(data.and(CBC_MASK).shln(0x78));

const _mergeAddressAndBlockNumber = (address, blockNumber) => toBN(blockNumber).and(BLOCK_NO_MASK).shln(0xa0).or(toBN(address));

const _extractAddressAndBlockNumber = (bn) => ({
  address: addHexPrefix(bn.and(ADDRESS_MASK).toString(16)),
  blockNumber: toDecimal(bn.shrn(0xa0))
});

const _expandBytes = (bn) => bn.mul(SALT_FACTOR);

const _recoverBytes = (bn) => bn.div(SALT_FACTOR);

const _validateDivisibility = (bn) => bn.mod(SALT_FACTOR).eqn(0);

const _validateAndRecoverBytes = (bn) => {
  if (!_validateDivisibility(bn)) throw Error('Invalid Validity ID');
  return _recoverBytes(bn);
};

const _prefixedIsValidityID = (prefixedId) => prefixedId.length === 66 && prefixedId.substr(0, 6) === '0xffcc' && _validateDivisibility(_computeFlippedValue(_idToData(prefixedId)));

const toValidityID = (address, blockNumber) => VALIDITY_ID_PREFIX + padLeft(_computeFlippedValue(_expandBytes(_mergeAddressAndBlockNumber(address, blockNumber))).toString(16), 60);

const fromValidityID = (id) => _extractAddressAndBlockNumber(_validateAndRecoverBytes(_computeFlippedValue(_idToData(id))));

const isValidityID = (id) => _prefixedIsValidityID(addHexPrefix(id))

Object.assign(module.exports, {
  toValidityID,
  fromValidityID,
  isValidityID
});
