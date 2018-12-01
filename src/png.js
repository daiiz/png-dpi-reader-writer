import {crc} from './crc32'

const toBin = (value, digits) => value.toString(2).padStart(digits, '0')
const toHex = (value, digits) => value.toString(16).padStart(digits, '0')

function bytes (num, bytes) {
  const binStr = num.toString(2).padStart(bytes * 8, '0')
  const binArr = binStr.match(/\d{8}/g)
  return binArr.map(v => parseInt(v, 2))
}

export class Png {
  constructor (arrayBufferOrDataURI) {
    this.pngSignature = /^89 50 4E 47 0D 0A 1A 0A$/i
    this.dataURIScheme = 'data:image/png;base64'
    this.byteArray = typeof arrayBufferOrDataURI === 'string' ?
      this.convertToByteArray(arrayBufferOrDataURI) : new Uint8Array(arrayBuffer)
    this.ptr = 0
    this.haspHYs = false
    // Number of pixels per unit when devicePixelRatio is 1
    this.pixelsPerMeter = 2835
  }

  writeChunkpHYs (devicePixelRatio=1) {
    this.devicePixelRatio = devicePixelRatio
    if (this.haspHYs) return
    this.readChunks()
  }

  get base64EncodedURI () {
    return `${this.dataURIScheme},${btoa(String.fromCharCode(...this.byteArray))}`
  }

  convertToByteArray (dataURI) {
    if (!dataURI.startsWith(this.dataURIScheme)) return null
    const rawStr = atob(dataURI.split(`${this.dataURIScheme},`)[1])
    const array = new Uint8Array(new ArrayBuffer(rawStr.length))
    for (let i = 0; i < rawStr.length; i++) {
      array[i] = rawStr.charCodeAt(i)
    }
    return array
  }

  isValid () {
    if (!this.byteArray) return false
    const signature = this.readBytes(8).map(v => toHex(v, 2))
    return signature.join(' ').match(this.pngSignature)
  }

  readBytes (bytes) {
    const res = this.byteArray.slice(this.ptr, this.ptr + bytes)
    this.ptr += bytes
    // Convert Uint8Array to Array
    return Array.from(res)
  }

  readIHDR () {
    // Length, ChunkType
    this.ptr += (4 + 4)

    const width = this.readBytes(4).map(v => toBin(v, 8))
    this.width = parseInt(width.join(''), 2)

    const height = this.readBytes(4).map(v => toBin(v, 8))
    this.height = parseInt(height.join(''), 2)

    // ビット深度, カラータイプ, 圧縮手法, フィルター手法, インターレース手法, CRC
    this.ptr += (1 + 1 + 1 + 1 + 1 + 4)
  }

  insertpHYs (dpi = 144) {
    const type = [112, 72, 89, 115] // "pHYs"
    const pixelsPerMeter = this.pixelsPerMeter * this.devicePixelRatio
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
    const ptr = this.ptr - 8
    this.byteArray = new Uint8Array([
      ...Array.from(this.byteArray.slice(0, ptr)),
      ...pHYsChunk,
      ...Array.from(this.byteArray.slice(ptr))
    ])
    this.ptr += pHYsChunk.length
  }

  readChunks () {
    if (!this.isValid()) return
    this.readIHDR()

    while (true) {
      if (this.ptr >= this.byteArray.length) break

      const lenBytes = this.readBytes(4)
      let chunkLength = lenBytes.map(v => toBin(v, 8))
      chunkLength = parseInt(chunkLength.join(''), 2)

      const bytes = this.readBytes(4)
      const chunkType = new TextDecoder('utf-8').decode(new Uint8Array(bytes))

      if (chunkType === 'IDAT') {
        if (!this.haspHYs) {
          console.log('insert pHYs chunk')
          this.insertpHYs()
          this.haspHYs = true
        }
        break
      }
      if (chunkType === 'IEND') break
      switch (chunkType) {
        case 'pHYs':
          this.haspHYs = true
          break
        default:
          this.ptr += chunkLength
      }
      // CRC
      this.ptr += 4
    }
  }
}
