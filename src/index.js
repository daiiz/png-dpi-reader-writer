import {crc} from './crc32'
import {toBin, toHex, bytes} from './utils'

const dataURIScheme = 'data:image/png;base64,'

export const convertToDataURI = byteArray => {
  return dataURIScheme + btoa(byteArray.reduce((data, byte) => {
    return data + String.fromCharCode(byte)
  }, ''))
}

export const convertToByteArray = dataURI => {
  if (!dataURI.startsWith(dataURIScheme)) return []
  const rawStr = atob(dataURI.split(dataURIScheme)[1])
  const array = new Uint8Array(new ArrayBuffer(rawStr.length))
  for (let i = 0; i < rawStr.length; i++) {
    array[i] = rawStr.charCodeAt(i)
  }
  return array
}

export const writeChunkPhys = (byteArray, dpr=1) => {
  const ptr = {pos: 0}
  if (!isPng(byteArray, ptr)) return byteArray
  const {width, height} = readIHDR(byteArray, ptr)

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
        console.log('insert pHYs chunk')
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
    ptr.pos += chunkLength
    ptr.pos += 4 // CRC
  }

  return newByteArray || byteArray
}

const isPng = (byteArray, ptr) => {
  const pngSignature = /^89 50 4E 47 0D 0A 1A 0A$/i
  const signature = readBytes(byteArray, ptr, 8).map(v => toHex(v, 2))
  return signature.join(' ').match(pngSignature)
}

const readBytes = (byteArray, ptr, bytes) => {
  const {pos} = ptr
  const res = byteArray.slice(pos, pos + bytes)
  ptr.pos += bytes
  return Array.from(res)
}

const readIHDR = (byteArray, ptr) => {
  // https://tools.ietf.org/html/rfc2083#page-15
  // Length, ChunkType
  ptr.pos += (4 + 4)
  // Width
  let width = readBytes(byteArray, ptr, 4).map(v => toBin(v, 8))
  width = parseInt(width.join(''), 2)
  // Height
  let height = readBytes(byteArray, ptr, 4).map(v => toBin(v, 8))
  height = parseInt(height.join(''), 2)
  // Bit depth, Color type, Compression method, Filter method, nterlace method, CRC
  ptr.pos += (1 + 1 + 1 + 1 + 1 + 4)
  return {width, height}
}

const insertChunkPhys = (byteArray, ptr, dpr=1) => {
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
