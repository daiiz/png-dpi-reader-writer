import {crc} from './crc32'
import {toBin, bytes, getCharCodes, isPng, readBytes, readIHDR} from './share'

function insertChunkPhys (byteArray, ptr, dpi=72) {
  const type = 'pHYs'.split('').map(c => c.charCodeAt(0))

  // Number of pixels per unit when DPI is 72
  // Number of pixels per unit when devicePixelRatio is 1
  const PX_PER_METER = 2835

  const dpr = dpi / 72
  const pixelsPerMeter = Math.floor(PX_PER_METER * dpr)
  const data = [
    ...bytes(pixelsPerMeter, 4),
    ...bytes(pixelsPerMeter, 4),
    1, // meter
  ]
  const pHYsChunk = [
    0, 0, 0, 9, // 9 bytes
    ...type,
    ...data,
    ...bytes(crc([...type, ...data]), 4)
  ]
  const pos = ptr.pos - 8
  const newByteArray = new Uint8Array([
    ...Array.from(byteArray.slice(0, pos)),
    ...pHYsChunk,
    ...Array.from(byteArray.slice(pos))
  ])
  ptr.pos += pHYsChunk.length
  return newByteArray
}

export function writePngDpi (arrayBuffer, dpi=72) {
  const ptr = {pos: 0}
  const byteArray = new Uint8Array(arrayBuffer)
  if (!isPng(byteArray, ptr)) return byteArray
  readIHDR(byteArray, ptr)

  let hasChunkPhys = false
  let newByteArray
  while (true) {
    if (ptr.pos >= byteArray.length) break

    let chunkLength = readBytes(byteArray, ptr, 4).map(v => toBin(v, 8))
    chunkLength = parseInt(chunkLength.join(''), 2)

    const chunkType = readBytes(byteArray, ptr, 4).join(' ')
    if (chunkType === getCharCodes('IDAT')) {
      if (!hasChunkPhys) {
        newByteArray = insertChunkPhys(byteArray, ptr, dpi)
        hasChunkPhys = true
      }
      break
    }

    if (chunkType === getCharCodes('IEND')) break

    switch (chunkType) {
      case getCharCodes('pHYs'):
        hasChunkPhys = true
    }
    ptr.pos += chunkLength + 4 // CRC
  }

  return newByteArray || byteArray
}
