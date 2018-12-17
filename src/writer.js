import {crc} from './crc32'
import {toBin, bytes, isPng, readBytes, readIHDR} from './share'

function insertChunkPhys (byteArray, ptr, dpr = 1) {
  const type = [112, 72, 89, 115] // "pHYs"
  // Number of pixels per unit when devicePixelRatio is 1
  const PX_PER_METER = 2835
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

export function writePngDpi (byteArray, dpr=1) {
  const ptr = {pos: 0}
  if (!isPng(byteArray, ptr)) return byteArray
  readIHDR(byteArray, ptr)

  let hasChunkPhys = false
  let newByteArray
  while (true) {
    if (ptr.pos >= byteArray.length) break

    let chunkLength = readBytes(byteArray, ptr, 4).map(v => toBin(v, 8))
    chunkLength = parseInt(chunkLength.join(''), 2)

    const chunkType = new TextDecoder('utf-8').decode(
      new Uint8Array(readBytes(byteArray, ptr, 4)))

    if (chunkType === 'IDAT') {
      if (!hasChunkPhys) {
        newByteArray = insertChunkPhys(byteArray, ptr, dpr)
        hasChunkPhys = true
      }
      break
    }

    if (chunkType === 'IEND') break

    switch (chunkType) {
      case 'pHYs':
        hasChunkPhys = true
    }
    ptr.pos += chunkLength + 4 // CRC
  }

  return newByteArray || byteArray
}
