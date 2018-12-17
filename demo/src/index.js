import {convertToByteArray, convertToDataURI, writePngDpi} from '../../src/'
import {DpiAwareImage} from 'dpi-aware-image'

const loadImage = async srcUrl => {
  const res = await fetch(srcUrl, {mode: 'cors'})
  const arrayBuffer = await res.arrayBuffer()
  if (!arrayBuffer) return
  // 遠回しだが、convertToDataURIの動作確認を兼ねている
  const base64DataURI = convertToDataURI(arrayBuffer)
  const orgByteArray = convertToByteArray(base64DataURI)
  const dpr = window.devicePixelRatio
  const genByteArray = writePngDpi(orgByteArray, dpr * 72)
  showImage(convertToDataURI(genByteArray))
}

const showImage = dataUrl => {
  const img = document.querySelector('#sample-image')
  img.setAttribute('src', dataUrl)
}

window.loadImage = loadImage
window.customElements.define(DpiAwareImage.is, DpiAwareImage)
