"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.writePngDpi=writePngDpi;var _crc=require("./crc32");var _share=require("./share");function insertChunkPhys(byteArray,ptr,dpi=72){const type="pHYs".split("").map(c=>c.charCodeAt(0));// Number of pixels per unit when DPI is 72
// Number of pixels per unit when devicePixelRatio is 1
const PX_PER_METER=2835;const dpr=dpi/72;const pixelsPerMeter=Math.floor(PX_PER_METER*dpr);const data=[...(0,_share.bytes)(pixelsPerMeter,4),...(0,_share.bytes)(pixelsPerMeter,4),1];const pHYsChunk=[0,0,0,9,// 9 bytes
...type,...data,...(0,_share.bytes)((0,_crc.crc)([...type,...data]),4)];const pos=ptr.pos-8;const newByteArray=new Uint8Array([...Array.from(byteArray.slice(0,pos)),...pHYsChunk,...Array.from(byteArray.slice(pos))]);ptr.pos+=pHYsChunk.length;return newByteArray}function writePngDpi(arrayBuffer,dpi=72){const ptr={pos:0};const byteArray=new Uint8Array(arrayBuffer);if(!(0,_share.isPng)(byteArray,ptr))return byteArray;(0,_share.readIHDR)(byteArray,ptr);let hasChunkPhys=false;let newByteArray;while(true){if(ptr.pos>=byteArray.length)break;let chunkLength=(0,_share.readBytes)(byteArray,ptr,4).map(v=>(0,_share.toBin)(v,8));chunkLength=parseInt(chunkLength.join(""),2);const chunkType=(0,_share.readBytes)(byteArray,ptr,4).join(" ");if(chunkType===(0,_share.getCharCodes)("IDAT")){if(!hasChunkPhys){newByteArray=insertChunkPhys(byteArray,ptr,dpi);hasChunkPhys=true}break}if(chunkType===(0,_share.getCharCodes)("IEND"))break;switch(chunkType){case(0,_share.getCharCodes)("pHYs"):hasChunkPhys=true;}ptr.pos+=chunkLength+4;// CRC
}return newByteArray||byteArray}