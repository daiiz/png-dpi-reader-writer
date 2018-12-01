/* Physical Portable Network Graphics */
class PhysPng extends HTMLElement {
  constructor (...props) {
    super(...props)
    this.pngSignature = '89 50 4E 47 0D 0A 1A 0A'
    this.width = 0
    this.height = 0
    this.dpi = 72
    this.byteArray = null
    this.ptr = 0
    this.render()
  }

  static get is () { return 'phys-png' }
  static get observedAttributes () { return ['src'] }

  setImgSize () {
    if (this.dpi === 72) return
    this.img.style.width = `${this.width / (this.dpi / 72)}px`
  }

  padZero (str, digits) {
    const zeros = '0'.repeat(digits)
    return (`${zeros}${str.toUpperCase()}`).slice(`-${digits}`)
  }

  readBytes (bytes) {
    const res = this.byteArray.slice(this.ptr, this.ptr + bytes)
    this.ptr += bytes
    // Convert Uint8Array to Array
    return Array.from(res)
  }

  toHex (value, digits) {
    return this.padZero(value.toString(16), digits)
  }

  toBin (value, digits) {
    return this.padZero(value.toString(2), digits)
  }

  async attributeChangedCallback (attr, oldVal, newVal) {
    const srcUrl = newVal
    const followdpi = this.getAttribute('followdpi')
    if (!this.img || !srcUrl) return
    if (followdpi === null) {
      this.img.setAttribute('src', srcUrl)
      return
    }

    const xhr = new XMLHttpRequest()
    xhr.open('GET', srcUrl, true)
    xhr.responseType = 'arraybuffer'
    xhr.onload = () => {
      const arrayBuffer = xhr.response
      if (arrayBuffer) {
        this.readChunks(arrayBuffer)
        this.setImgSize()
      }
      this.img.setAttribute('src', srcUrl)
    }
    xhr.onerror = err => {
      console.error(err)
      this.img.setAttribute('src', srcUrl)
    }
    xhr.send(null)
  }

  readIHDR () {
    // Length, ChunkType
    this.ptr += (4 + 4)

    // Width
    const width = this.readBytes(4).map(v => this.toBin(v, 8))
    this.width = parseInt(width.join(''), 2)

    // Height
    const height = this.readBytes(4).map(v => this.toBin(v, 8))
    this.height = parseInt(height.join(''), 2)

    // ビット深度, カラータイプ, 圧縮手法, フィルター手法, インターレース手法, CRC
    this.ptr += (1 + 1 + 1 + 1 + 1 + 4)
  }

  readpHYs () {
    const pixelsPerUnitXAxis = parseInt(
      this.readBytes(4).map(v => this.toBin(v, 8)).join(''), 2)
    const pixelsPerUnitYAxis = parseInt(
      this.readBytes(4).map(v => this.toBin(v, 8)).join(''), 2)
    const unitSpecifier = this.readBytes(1) // meters
    if (unitSpecifier > 0) {
      // dots per inch を計算する
      this.dpi = Math.floor(
        Math.max(pixelsPerUnitXAxis, pixelsPerUnitYAxis) / (unitSpecifier * 39.3))
    }
  }

  isPngFile () {
    const signature = this.readBytes(8).map(v => this.toHex(v, 2))
    return signature.join(' ') === this.pngSignature
  }

  readChunks (arrayBuffer) {
    this.byteArray = new Uint8Array(arrayBuffer)
    /* PNGファイルシグネチャ確認 */
    if (!this.isPngFile()) return
    /* IHDRチャンク */
    this.readIHDR()

    while (true) {
      if (this.ptr >= this.byteArray.length) break

      let chunkLength = this.readBytes(4).map(v => this.toBin(v, 8))
      chunkLength = parseInt(chunkLength.join(''), 2)

      const chunkType = new TextDecoder('utf-8')
        .decode(new Uint8Array(this.readBytes(4)))

      // Chunk Data
      if (chunkType === 'IDAT' || chunkType === 'IEND') break
      switch (chunkType) {
        case 'pHYs':
          this.readpHYs()
          break
        default:
          this.ptr += chunkLength
      }
      // CRC
      this.ptr += 4
    }
  }

  render () {
    const shadowRoot = this.attachShadow({mode: 'open'})
    this.img = document.createElement('img')
    shadowRoot.appendChild(this.img)
  }
}

customElements.define(PhysPng.is, PhysPng)
