const crypto = require('crypto');
const { get } = require('http');
const fetch = require('node-fetch');

async function getUrlMD5() {
  process.on('message', async (url) => {
    const response = await fetch(url);
    const buffer = await response.buffer();
    const hash = crypto.createHash('md5');
    hash.update(buffer);
    const md5 = hash.digest('hex');
    process.send(md5);
    process.exit(0);
  });
}

getUrlMD5();
