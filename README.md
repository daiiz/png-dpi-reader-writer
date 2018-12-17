# png-dpi-reader-writer

Reader/Writer for png image's pHYs chunk on browsers.

[![CircleCI](https://circleci.com/gh/daiiz/png-dpi-reader-writer/tree/master.svg?style=svg)](https://circleci.com/gh/daiiz/png-dpi-reader-writer/tree/master)


## Installation
```
$ npm install png-dpi-reader-writer
```

## Usage

### Reader
Detect width, height and DPI for PNG image.
```js
const res = await fetch(srcUrl, {mode: 'cors'})
const arrayBuffer = await res.arrayBuffer()

const {width, height, dpi} = parsePngFormat(arrayBuffer)
```

### Writer
Write DPI for PNG image. See also demo/src/index.js.
```js
const newByteArray = writePngDpi(arrayBuffer, window.devicePixelRatio * 72)

const img = document.querySelector('img')
img.src = convertToDataURI(newByteArray)
```

## Demo
```
$ npm run start
```
- http://localhost:9006/demo/index.html
- https://daiiz.github.io/png-dpi-reader-writer/demo/index.html

## Related projects
- https://github.com/daiiz/dpi-aware-image
