// node ./tools/make_crc_table.js

function toHex (value, digits) {
  return value.toString(16).padStart(digits, '0')
}

// https://tools.ietf.org/html/rfc2083#page-94
 /* Table of CRCs of all 8-bit messages. */
const crc_table = new Array(256)

function makeCrcTable () {
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1)
      } else {
        c = c >>> 1
      }
    }
    crc_table[n] = c >>> 0 // u32
  }
}

makeCrcTable()
console.log(crc_table.map(v => `0x${toHex(v, 8)}`).join(', '))
