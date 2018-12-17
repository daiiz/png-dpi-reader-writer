const {assert} = require('chai')
const fs = require('fs')
const {parsePngFormat} = require('../lib/')

describe('parse images', function () {
  it('detect width, height and dpi from Retina screenshot png image', function () {
    // Screenshot with Retina display taken by macOS screenshot app
    const buf = fs.readFileSync('./test/images/dpi-144.png')
    const {width, height, dpi} = parsePngFormat(buf)
    assert.equal(width, 170)
    assert.equal(height, 100)
    assert.equal(dpi, 144)
  })

  it('detect width and height, return undefined for dpi', function () {
    // Screenshot with non-Retina display taken by macOS screenshot app
    const buf = fs.readFileSync('./test/images/dpi-empty.png')
    const {width, height, dpi} = parsePngFormat(buf)
    assert.equal(width, 85)
    assert.equal(height, 50)
    assert.isUndefined(dpi)
  })

  it('return undefined for width, height and dpi', function () {
    // Not PNG image
    const buf = fs.readFileSync('./test/images/not-png.gif')
    const {width, height, dpi} = parsePngFormat(buf)
    assert.isUndefined(width)
    assert.isUndefined(height)
    assert.isUndefined(dpi)
  })
})
