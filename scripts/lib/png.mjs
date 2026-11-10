import {deflateSync} from 'node:zlib';

function crc32(bytes){
  let crc=0xffffffff;
  for(const byte of bytes){
    crc^=byte;
    for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
  }
  return (crc^0xffffffff)>>>0;
}

function chunk(type,bytes){
  const name=Buffer.from(type),size=Buffer.alloc(4),crc=Buffer.alloc(4);
  size.writeUInt32BE(bytes.length);
  crc.writeUInt32BE(crc32(Buffer.concat([name,bytes])));
  return Buffer.concat([size,name,bytes,crc]);
}

export function encodeRgbaPng(width,height,pixels){
  const header=Buffer.alloc(13);
  header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
  const stride=width*4,scanlines=Buffer.alloc((stride+1)*height);
  for(let row=0;row<height;row++)pixels.copy(scanlines,row*(stride+1)+1,row*stride,(row+1)*stride);
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR',header),chunk('IDAT',deflateSync(scanlines)),chunk('IEND',Buffer.alloc(0))
  ]);
}
