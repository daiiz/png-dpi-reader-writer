"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parsePngFormat = parsePngFormat;

var _share = require("./share");

function parsePngFormat(arrayBuffer) {
  var ptr = {
    pos: 0
  };
  var byteArray = new Uint8Array(arrayBuffer);
  return readChunks(byteArray, ptr);
}

var readpHYs = function readpHYs(byteArray, ptr) {
  // https://tools.ietf.org/html/rfc2083#page-22
  var pixelsPerUnitXAxis = parseInt((0, _share.readBytes)(byteArray, ptr, 4).map(function (v) {
    return (0, _share.toBin)(v, 8);
  }).join(''), 2);
  var pixelsPerUnitYAxis = parseInt((0, _share.readBytes)(byteArray, ptr, 4).map(function (v) {
    return (0, _share.toBin)(v, 8);
  }).join(''), 2);
  var unitSpecifier = (0, _share.readBytes)(byteArray, ptr, 1).pop();
  var dpi = 72;

  if (unitSpecifier === 1) {
    // dots per inch を計算する
    dpi = Math.floor(Math.max(pixelsPerUnitXAxis, pixelsPerUnitYAxis) / (unitSpecifier * 39.3));
  }

  return dpi;
};

var readChunks = function readChunks(byteArray, ptr) {
  if (!(0, _share.isPng)(byteArray, ptr)) {
    return {
      width: undefined,
      height: undefined,
      dpi: undefined
    };
  }

  var _readIHDR = (0, _share.readIHDR)(byteArray, ptr),
      width = _readIHDR.width,
      height = _readIHDR.height;

  var dpi;

  while (true) {
    if (ptr.pos >= byteArray.length) break;
    var chunkLength = (0, _share.readBytes)(byteArray, ptr, 4).map(function (v) {
      return (0, _share.toBin)(v, 8);
    });
    chunkLength = parseInt(chunkLength.join(''), 2);
    var chunkType = (0, _share.readBytes)(byteArray, ptr, 4).join(' ');
    if (chunkType === (0, _share.getCharCodes)('IDAT') || chunkType === (0, _share.getCharCodes)('IEND')) break;

    switch (chunkType) {
      case (0, _share.getCharCodes)('pHYs'):
        dpi = readpHYs(byteArray, ptr);
        break;

      default:
        ptr.pos += chunkLength;
    }

    ptr.pos += 4; // CRC
  }

  return {
    width: width,
    height: height,
    dpi: dpi
  };
};