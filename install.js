#!/usr/bin/env node

const axios = require("axios");
const fs = require("fs");
const run = async function(url) {
  const result = await axios.get(url);
  const config = result.data;
  if(typeof config.uuid == 'undefined') {
    console.log('Invalid Config');
    return;
  }
  fs.writeFileSync('./'+config.uuid+'.json',JSON.stringify(config));
  console.log('Wrote: '+config.uuid);
  return;
}

if(process.argv.length<3) {
  console.log('Usage:\n node install.js https://urlto/config');
} else {
  run(process.argv[2]);
}
