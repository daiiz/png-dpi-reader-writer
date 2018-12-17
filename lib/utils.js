"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bytes = bytes;
exports.isPng = isPng;
exports.readBytes = readBytes;
exports.readIHDR = readIHDR;
exports.toHex = exports.toBin = void 0;

const toBin = (value, digits) => value.toString(2).padStart(digits, '0');

exports.toBin = toBin;

const toHex = (value, digits) => value.toString(16).padStart(digits, '0');

exports.toHex = toHex;

function bytes(num, bytes) {
  const binStr = num.toString(2).padStart(bytes * 8, '0');
  const binArr = binStr.match(/\d{8}/g);
  return binArr.map(v => parseInt(v, 2));
}

function isPng(byteArray, ptr) {
  const pngSignature = /^89 50 4E 47 0D 0A 1A 0A$/i;
  const signature = readBytes(byteArray, ptr, 8).map(v => toHex(v, 2));
  return signature.join(' ').match(pngSignature);
}

function readBytes(byteArray, ptr, bytes) {
  const {
    pos
  } = ptr;
  const res = byteArray.slice(pos, pos + bytes);
  ptr.pos += bytes;
  return Array.from(res);
}

function readIHDR(byteArray, ptr) {
  // https://tools.ietf.org/html/rfc2083#page-15
  // Length, ChunkType
  ptr.pos += 4 + 4; // Width

  let width = readBytes(byteArray, ptr, 4).map(v => toBin(v, 8));
  width = parseInt(width.join(''), 2); // Height

  let height = readBytes(byteArray, ptr, 4).map(v => toBin(v, 8));
  height = parseInt(height.join(''), 2); // Bit depth, Color type, Compression method, Filter method, nterlace method, CRC

  ptr.pos += 1 + 1 + 1 + 1 + 1 + 4;
  return {
    width,
    height
  };
}