const {assert} = require('chai')
const fs = require('fs')
const {parsePngFormat, writePngDpi} = require('../lib/')

describe('write dpi', function () {
  it('write integer dpi, width and height do not change', function () {
    // Screenshot with non-Retina display taken by macOS screenshot app
    const buf = fs.readFileSync('./test/images/dpi-empty.png')
    const {width, height, dpi} = parsePngFormat(buf)
    assert.isUndefined(dpi)

    const outBuf = writePngDpi(buf, 90) // 72 * 1.25
    const out = parsePngFormat(outBuf)

    assert.equal(out.width, width)
    assert.equal(out.height, height)
    assert.equal(out.dpi, 90)
  })

  it('round to an integer given a decimal', function () {
    const buf = fs.readFileSync('./test/images/dpi-empty.png')
    const {width, height, dpi} = parsePngFormat(buf)
    assert.isUndefined(dpi)

    const outBuf = writePngDpi(buf, 72.5)
    const out = parsePngFormat(outBuf)

    assert.equal(out.width, width)
    assert.equal(out.height, height)
    assert.equal(out.dpi, 72)
  })
})

describe('do not override dpi', function () {
  it('dpi does not change before and after processing', function () {
    // Screenshot with Retina display taken by macOS screenshot app
    const buf = fs.readFileSync('./test/images/dpi-144.png')
    const {width, height, dpi} = parsePngFormat(buf)
    assert.equal(dpi, 144)

    const outBuf = writePngDpi(buf, 72)
    const out = parsePngFormat(outBuf)

    assert.equal(out.width, width)
    assert.equal(out.height, height)
    assert.equal(out.dpi, dpi)
  })
})

describe('do not process files other than png image', function () {
  it('dpi does not change, undefined, before and after processing', function () {
    const buf = fs.readFileSync('./test/images/not-png.gif')

    const outBuf = writePngDpi(buf, 144)
    const out = parsePngFormat(outBuf)

    assert.isUndefined(out.width)
    assert.isUndefined(out.height)
    assert.isUndefined(out.dpi)
  })
})
