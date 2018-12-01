export const toBin = (value, digits) => value.toString(2).padStart(digits, '0')
export const toHex = (value, digits) => value.toString(16).padStart(digits, '0')

export function bytes (num, bytes) {
  const binStr = num.toString(2).padStart(bytes * 8, '0')
  const binArr = binStr.match(/\d{8}/g)
  return binArr.map(v => parseInt(v, 2))
}
