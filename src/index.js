import {writePngDpi} from './writer'
import {readPngDpi} from './reader'
const dataURIScheme = 'data:image/png;base64,'

const convertToDataURI = byteArray => {
  return dataURIScheme + btoa(byteArray.reduce((data, byte) => {
    return data + String.fromCharCode(byte)
  }, ''))
}

const convertToByteArray = dataURI => {
  if (!dataURI.startsWith(dataURIScheme)) return []
  const rawStr = atob(dataURI.split(dataURIScheme)[1])
  const array = new Uint8Array(new ArrayBuffer(rawStr.length))
  for (let i = 0; i < rawStr.length; i++) {
    array[i] = rawStr.charCodeAt(i)
  }
  return array
}

export {readPngDpi, writePngDpi, convertToDataURI, convertToByteArray}
