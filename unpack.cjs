const fs = require('node:fs');
const zlib = require('node:zlib');
const bytes = fs.readFileSync('source.tar.br');
fs.writeFileSync('source.tar', zlib.brotliDecompressSync(bytes));
console.log('Source unpacked for build');
