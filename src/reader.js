import {toBin, isPng, readIHDR, readBytes} from './share'

export function parsePngFormat (arrayBuffer) {
  const ptr = {pos: 0}
  const byteArray = new Uint8Array(arrayBuffer)
  return readChunks(byteArray, ptr)
}

const getCharCodes = str => {
  return str.split('').map(c => c.charCodeAt(0)).join(' ')
}

const readpHYs = (byteArray, ptr) => {
  // https://tools.ietf.org/html/rfc2083#page-22
  const pixelsPerUnitXAxis = parseInt(
    readBytes(byteArray, ptr, 4).map(v => toBin(v, 8)).join(''), 2)
  const pixelsPerUnitYAxis = parseInt(
    readBytes(byteArray, ptr, 4).map(v => toBin(v, 8)).join(''), 2)
  const unitSpecifier = readBytes(byteArray, ptr, 1).pop()
  let dpi = 72
  if (unitSpecifier === 1) {
    // dots per inch を計算する
    dpi = Math.floor(Math.max(pixelsPerUnitXAxis, pixelsPerUnitYAxis) / (unitSpecifier * 39.3))
  }
  return dpi
}

const readChunks = (byteArray, ptr) => {
  if (!isPng(byteArray, ptr)) {
    return {
      width: undefined,
      height: undefined,
      dpi: undefined
    }
  }
  const {width, height} = readIHDR(byteArray, ptr)
  let dpi
  while (true) {
    if (ptr.pos >= byteArray.length) break

    let chunkLength = readBytes(byteArray, ptr, 4).map(v => toBin(v, 8))
    chunkLength = parseInt(chunkLength.join(''), 2)

    const chunkType = readBytes(byteArray, ptr, 4).join(' ')
    if (chunkType === getCharCodes('IDAT') || chunkType === getCharCodes('IEND')) break
    switch (chunkType) {
      case getCharCodes('pHYs'):
        dpi = readpHYs(byteArray, ptr)
        break
      default:
        ptr.pos += chunkLength
    }
    ptr.pos += 4 // CRC
  }
  return {width, height, dpi}
}
