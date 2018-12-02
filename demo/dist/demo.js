(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var _src = _interopRequireDefault(require("../../src/"));

require("phys-png");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const loadImage = async srcUrl => {
  const res = await fetch(srcUrl, {
    mode: 'cors'
  });
  const arrayBuffer = await res.arrayBuffer();
  if (!arrayBuffer) return; // const png = new Png(arrayBuffer)
  // base64 stringを渡す実験

  const base64DataURI = base64EncodedURI(arrayBuffer);
  const png = new _src.default(base64DataURI);
  png.writeChunkpHYs(devicePixelRatio);
  console.log(png);
  showImage(png.base64EncodedURI);
}; // XXX: 実験用


const base64EncodedURI = arrayBuffer => {
  const byteArray = new Uint8Array(arrayBuffer);
  return `data:image/png;base64,${btoa(String.fromCharCode(...byteArray))}`;
};

const showImage = dataUrl => {
  const img = document.querySelector('#sample-image');
  img.setAttribute('src', dataUrl);
};

window.loadImage = loadImage;

},{"../../src/":4,"phys-png":2}],2:[function(require,module,exports){
/* Physical Portable Network Graphics */
class PhysPng extends HTMLElement {
  constructor (...props) {
    super(...props)
    this.pngSignature = /^89 50 4E 47 0D 0A 1A 0A$/i
    this.byteArray = null
    this.ptr = 0
    this.initImg()
    this.render()
  }

  static get is () { return 'phys-png' }
  static get observedAttributes () { return ['src'] }

  get metadata () {
    return {
      rawWidth: this.width,
      rawHeight: this.height,
      dpi: this.dpi,
      src: this.getAttribute('src')
    }
  }

  initImg () {
    this.width = 0
    this.height = 0
    this.dpi = 72
    if (this.img) {
      this.img.removeAttribute('src')
      this.img.removeAttribute('style')
    }
  }

  setImgSize () {
    if (this.dpi === 72) return
    this.img.style.width = `${this.width / (this.dpi / 72)}px`
  }

  readBytes (bytes) {
    const res = this.byteArray.slice(this.ptr, this.ptr + bytes)
    this.ptr += bytes
    // Convert Uint8Array to Array
    return Array.from(res)
  }

  toHex (value, digits) {
    return value.toString(16).padStart(digits, '0')
  }

  toBin (value, digits) {
    return value.toString(2).padStart(digits, '0')
  }

  async attributeChangedCallback (attr, oldVal, newVal) {
    if (newVal === oldVal) return
    const srcUrl = newVal
    const followdpi = this.getAttribute('followdpi')
    if (!this.img || !srcUrl) return
    if (!!oldVal) this.initImg()
    if (followdpi === null) {
      this.img.setAttribute('src', srcUrl)
      return
    }
    const res = await fetch(srcUrl, {mode: 'cors'})
    const arrayBuffer = await res.arrayBuffer()
    if (arrayBuffer) {
      this.readChunks(arrayBuffer)
      this.setImgSize()
    }
    this.img.setAttribute('src', srcUrl)
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
    return signature.join(' ').match(this.pngSignature)
  }

  readChunks (arrayBuffer) {
    this.ptr = 0
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

},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.crc = crc;
// https://tools.ietf.org/html/rfc2083#page-94
const crcTable = [0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA, 0x076DC419, 0x706AF48F, 0xE963A535, 0x9E6495A3, 0x0EDB8832, 0x79DCB8A4, 0xE0D5E91E, 0x97D2D988, 0x09B64C2B, 0x7EB17CBD, 0xE7B82D07, 0x90BF1D91, 0x1DB71064, 0x6AB020F2, 0xF3B97148, 0x84BE41DE, 0x1ADAD47D, 0x6DDDE4EB, 0xF4D4B551, 0x83D385C7, 0x136C9856, 0x646BA8C0, 0xFD62F97A, 0x8A65C9EC, 0x14015C4F, 0x63066CD9, 0xFA0F3D63, 0x8D080DF5, 0x3B6E20C8, 0x4C69105E, 0xD56041E4, 0xA2677172, 0x3C03E4D1, 0x4B04D447, 0xD20D85FD, 0xA50AB56B, 0x35B5A8FA, 0x42B2986C, 0xDBBBC9D6, 0xACBCF940, 0x32D86CE3, 0x45DF5C75, 0xDCD60DCF, 0xABD13D59, 0x26D930AC, 0x51DE003A, 0xC8D75180, 0xBFD06116, 0x21B4F4B5, 0x56B3C423, 0xCFBA9599, 0xB8BDA50F, 0x2802B89E, 0x5F058808, 0xC60CD9B2, 0xB10BE924, 0x2F6F7C87, 0x58684C11, 0xC1611DAB, 0xB6662D3D, 0x76DC4190, 0x01DB7106, 0x98D220BC, 0xEFD5102A, 0x71B18589, 0x06B6B51F, 0x9FBFE4A5, 0xE8B8D433, 0x7807C9A2, 0x0F00F934, 0x9609A88E, 0xE10E9818, 0x7F6A0DBB, 0x086D3D2D, 0x91646C97, 0xE6635C01, 0x6B6B51F4, 0x1C6C6162, 0x856530D8, 0xF262004E, 0x6C0695ED, 0x1B01A57B, 0x8208F4C1, 0xF50FC457, 0x65B0D9C6, 0x12B7E950, 0x8BBEB8EA, 0xFCB9887C, 0x62DD1DDF, 0x15DA2D49, 0x8CD37CF3, 0xFBD44C65, 0x4DB26158, 0x3AB551CE, 0xA3BC0074, 0xD4BB30E2, 0x4ADFA541, 0x3DD895D7, 0xA4D1C46D, 0xD3D6F4FB, 0x4369E96A, 0x346ED9FC, 0xAD678846, 0xDA60B8D0, 0x44042D73, 0x33031DE5, 0xAA0A4C5F, 0xDD0D7CC9, 0x5005713C, 0x270241AA, 0xBE0B1010, 0xC90C2086, 0x5768B525, 0x206F85B3, 0xB966D409, 0xCE61E49F, 0x5EDEF90E, 0x29D9C998, 0xB0D09822, 0xC7D7A8B4, 0x59B33D17, 0x2EB40D81, 0xB7BD5C3B, 0xC0BA6CAD, 0xEDB88320, 0x9ABFB3B6, 0x03B6E20C, 0x74B1D29A, 0xEAD54739, 0x9DD277AF, 0x04DB2615, 0x73DC1683, 0xE3630B12, 0x94643B84, 0x0D6D6A3E, 0x7A6A5AA8, 0xE40ECF0B, 0x9309FF9D, 0x0A00AE27, 0x7D079EB1, 0xF00F9344, 0x8708A3D2, 0x1E01F268, 0x6906C2FE, 0xF762575D, 0x806567CB, 0x196C3671, 0x6E6B06E7, 0xFED41B76, 0x89D32BE0, 0x10DA7A5A, 0x67DD4ACC, 0xF9B9DF6F, 0x8EBEEFF9, 0x17B7BE43, 0x60B08ED5, 0xD6D6A3E8, 0xA1D1937E, 0x38D8C2C4, 0x4FDFF252, 0xD1BB67F1, 0xA6BC5767, 0x3FB506DD, 0x48B2364B, 0xD80D2BDA, 0xAF0A1B4C, 0x36034AF6, 0x41047A60, 0xDF60EFC3, 0xA867DF55, 0x316E8EEF, 0x4669BE79, 0xCB61B38C, 0xBC66831A, 0x256FD2A0, 0x5268E236, 0xCC0C7795, 0xBB0B4703, 0x220216B9, 0x5505262F, 0xC5BA3BBE, 0xB2BD0B28, 0x2BB45A92, 0x5CB36A04, 0xC2D7FFA7, 0xB5D0CF31, 0x2CD99E8B, 0x5BDEAE1D, 0x9B64C2B0, 0xEC63F226, 0x756AA39C, 0x026D930A, 0x9C0906A9, 0xEB0E363F, 0x72076785, 0x05005713, 0x95BF4A82, 0xE2B87A14, 0x7BB12BAE, 0x0CB61B38, 0x92D28E9B, 0xE5D5BE0D, 0x7CDCEFB7, 0x0BDBDF21, 0x86D3D2D4, 0xF1D4E242, 0x68DDB3F8, 0x1FDA836E, 0x81BE16CD, 0xF6B9265B, 0x6FB077E1, 0x18B74777, 0x88085AE6, 0xFF0F6A70, 0x66063BCA, 0x11010B5C, 0x8F659EFF, 0xF862AE69, 0x616BFFD3, 0x166CCF45, 0xA00AE278, 0xD70DD2EE, 0x4E048354, 0x3903B3C2, 0xA7672661, 0xD06016F7, 0x4969474D, 0x3E6E77DB, 0xAED16A4A, 0xD9D65ADC, 0x40DF0B66, 0x37D83BF0, 0xA9BCAE53, 0xDEBB9EC5, 0x47B2CF7F, 0x30B5FFE9, 0xBDBDF21C, 0xCABAC28A, 0x53B39330, 0x24B4A3A6, 0xBAD03605, 0xCDD70693, 0x54DE5729, 0x23D967BF, 0xB3667A2E, 0xC4614AB8, 0x5D681B02, 0x2A6F2B94, 0xB40BBE37, 0xC30C8EA1, 0x5A05DF1B, 0x2D02EF8D];
/* Update a running CRC with the bytes buf[0..len-1] */

function updateCrc(crc, buf, len) {
  for (let n = 0; n < len; n++) {
    crc = crc >>> 8 ^ crcTable[(crc ^ buf[n]) & 0xff];
  }

  return crc;
}
/* Return the CRC of the bytes buf[0..len-1]. */


function crc(buf) {
  return (updateCrc(-1, buf, buf.length) ^ -1) >>> 0; // u32
}

},{}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _png = require("./png");

var _default = _png.Png;
exports.default = _default;

},{"./png":5}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Png = void 0;

var _crc = require("./crc32");

var _utils = require("./utils");

class Png {
  constructor(arrayBufferOrDataURI) {
    this.pngSignature = /^89 50 4E 47 0D 0A 1A 0A$/i;
    this.dataURIScheme = 'data:image/png;base64';
    this.byteArray = typeof arrayBufferOrDataURI === 'string' ? this.convertToByteArray(arrayBufferOrDataURI) : new Uint8Array(arrayBuffer);
    this.ptr = 0;
    this.haspHYs = false; // Number of pixels per unit when devicePixelRatio is 1

    this.pixelsPerMeter = 2835;
  }

  writeChunkpHYs(devicePixelRatio = 1) {
    this.devicePixelRatio = devicePixelRatio;
    if (this.haspHYs) return;
    this.readChunks();
  }

  get base64EncodedURI() {
    return `${this.dataURIScheme},${btoa(String.fromCharCode(...this.byteArray))}`;
  }

  convertToByteArray(dataURI) {
    if (!dataURI.startsWith(this.dataURIScheme)) return null;
    const rawStr = atob(dataURI.split(`${this.dataURIScheme},`)[1]);
    const array = new Uint8Array(new ArrayBuffer(rawStr.length));

    for (let i = 0; i < rawStr.length; i++) {
      array[i] = rawStr.charCodeAt(i);
    }

    return array;
  }

  isValid() {
    if (!this.byteArray) return false;
    const signature = this.readBytes(8).map(v => (0, _utils.toHex)(v, 2));
    return signature.join(' ').match(this.pngSignature);
  }

  readBytes(bytes) {
    const res = this.byteArray.slice(this.ptr, this.ptr + bytes);
    this.ptr += bytes; // Convert Uint8Array to Array

    return Array.from(res);
  }

  readIHDR() {
    // Length, ChunkType
    this.ptr += 4 + 4;
    const width = this.readBytes(4).map(v => (0, _utils.toBin)(v, 8));
    this.width = parseInt(width.join(''), 2);
    const height = this.readBytes(4).map(v => (0, _utils.toBin)(v, 8));
    this.height = parseInt(height.join(''), 2); // ビット深度, カラータイプ, 圧縮手法, フィルター手法, インターレース手法, CRC

    this.ptr += 1 + 1 + 1 + 1 + 1 + 4;
  }

  insertpHYs(dpi = 144) {
    const type = [112, 72, 89, 115]; // "pHYs"

    const pixelsPerMeter = this.pixelsPerMeter * this.devicePixelRatio;
    const data = [...(0, _utils.bytes)(pixelsPerMeter, 4), ...(0, _utils.bytes)(pixelsPerMeter, 4), 1];
    const pHYsChunk = [0, 0, 0, 9, // 9 bytes
    ...type, ...data, ...(0, _utils.bytes)((0, _crc.crc)([...type, ...data]), 4)];
    const ptr = this.ptr - 8;
    this.byteArray = new Uint8Array([...Array.from(this.byteArray.slice(0, ptr)), ...pHYsChunk, ...Array.from(this.byteArray.slice(ptr))]);
    this.ptr += pHYsChunk.length;
  }

  readChunks() {
    if (!this.isValid()) return;
    this.readIHDR();

    while (true) {
      if (this.ptr >= this.byteArray.length) break;
      const lenBytes = this.readBytes(4);
      let chunkLength = lenBytes.map(v => (0, _utils.toBin)(v, 8));
      chunkLength = parseInt(chunkLength.join(''), 2);
      const bytes = this.readBytes(4);
      const chunkType = new TextDecoder('utf-8').decode(new Uint8Array(bytes));

      if (chunkType === 'IDAT') {
        if (!this.haspHYs) {
          console.log('insert pHYs chunk');
          this.insertpHYs();
          this.haspHYs = true;
        }

        break;
      }

      if (chunkType === 'IEND') break;

      switch (chunkType) {
        case 'pHYs':
          this.haspHYs = true;
          break;

        default:
          this.ptr += chunkLength;
      } // CRC


      this.ptr += 4;
    }
  }

}

exports.Png = Png;

},{"./crc32":3,"./utils":6}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bytes = bytes;
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

},{}]},{},[1]);