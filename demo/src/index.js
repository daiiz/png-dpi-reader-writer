import Png from '../../src/'
import 'phys-png'

const loadImage = async srcUrl => {
  const res = await fetch(srcUrl, {mode: 'cors'})
  const arrayBuffer = await res.arrayBuffer()
  if (!arrayBuffer) return
  // const png = new Png(arrayBuffer)
  // base64 stringを渡す実験
  const base64DataURI = base64EncodedURI(arrayBuffer)
  const png = new Png(base64DataURI)
  png.writeChunkpHYs(devicePixelRatio)

  console.log(png)
  showImage(png.base64EncodedURI)
}

// XXX: 実験用
const base64EncodedURI = arrayBuffer => {
  const byteArray = new Uint8Array(arrayBuffer)
  return `data:image/png;base64,${btoa(String.fromCharCode(...byteArray))}`
}

const showImage = dataUrl => {
  const img = document.querySelector('#sample-image')
  img.setAttribute('src', dataUrl)
}

window.loadImage = loadImage
