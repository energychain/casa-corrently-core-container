#!/usr/bin/env node

const fileExists = async path => !!(await fs.promises.stat(path).catch(e => false));
const fs = require('fs');
const { exec } = require("child_process");
const express = require('express');
const app = express();
let msgs = {};

const memStorage = {
  memstorage:{},
  get:function(key) {
    return this.memstorage[key];
  },
  set:function(key,value) {
    this.memstorage[key] = value;
  }
};
let ipfs_publisher = null;

function execShellCommand(cmd) {
 const exec = require('child_process').exec;
 return new Promise((resolve, reject) => {
  exec(cmd, (error, stdout, stderr) => {
   if (error) {
    console.warn(error);
   }
   resolve(stdout? stdout : stderr);
  });
 });
}

const installCCandUpdate = async function() {
  fs.writeFileSync('./package.json',JSON.stringify({
        "name": "casa-corrently-local",
        "private": true,
        "version": "0.0.1",
        "dependencies": {
          "casa-corrently": "*",
          "casa-corrently-ipfs-edge": "*",
          "casa-corrently-openems": "*"
        }
    }));
  await execShellCommand('npm update');
  await execShellCommand('npm ci');
  return
}

const startLocalIPFSService = async function() {
  ipfs_publisher = require(process.cwd()+"/node_modules/casa-corrently-ipfs-edge/index.js")({});
  return;
}

const onUpdate = async function(confpath) {
  const CasaCorrently = require(process.cwd()+"/node_modules/casa-corrently/app.js");

  let msg = {
    payload: {},
    topic: 'statistics'
  };

  const main = await CasaCorrently();
  let files = fs.readdirSync(confpath);
  for(let i=0;i<files.length;i++) {
    if(files[i].indexOf('.json') > 0) {
      try {
        let config = JSON.parse(fs.readFileSync(confpath+"/"+files[i]));
        if((typeof config.name !== 'undefined')&&(typeof config.uuid !== 'undefined')) {
            let result = await main.meterLib(msg,config,memStorage);
            if(typeof msgs[config.uuid] == 'undefined') {
                app.use('/'+config.uuid,express.static(process.cwd()+"/node_modules/casa-corrently/public/", {}));
                app.get('/'+config.uuid+'/msg', async function (req, res) {
                    res.send(msgs[config.uuid]);
                });
            }
            msgs[config.uuid] = result;
            await ipfs_publisher.publish(result,config.uuid);
            console.log('Update uuid',config.uuid);
        }
      } catch(e) {
        console.log(e);
      }
    }
  }
  return;
}

const boot = async function() {
  await installCCandUpdate();
  await startLocalIPFSService();

  app.listen(3000);

  let confDir = './';
  if(process.argv.length == 3) {
      confDir =   process.argv[2];
  }
  onUpdate(confDir);
  setInterval(function() {
    onUpdate(confDir);
  },900000);
  console.log("Update Publisher started");
}

boot();
