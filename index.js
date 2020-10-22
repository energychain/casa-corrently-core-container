#!/usr/bin/env node

const fileExists = async path => !!(await fs.promises.stat(path).catch(e => false));
const fs = require('fs');
const { exec } = require("child_process");
const express = require('express');
const app = express();
const axios = require("axios");
let msgs = {};
let confDir = './';
let uuids = [];


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
  console.log('Install and Update');
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
  console.log('Starting IPFS Service');
  ipfs_publisher = require(process.cwd()+"/node_modules/casa-corrently-ipfs-edge/index.js")({uuid:'ipfs-node-edge2',name:'ipfs-node',remoteHistory:true});
  app.get('/', async function (req, res) {
    let index = '<html><head><title>/</title></heady><body><ul>';
    for(let i=0;i<uuids.length;i++) {
      index += '<li><a href="'+uuids[i]+'/">'+uuids[i]+'</a></li>';
    }
    index += '</ul></body></html>';
    res.send(index);
  });
  app.get('/.json', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.send(uuids);
  });
  app.get('/p2p', async function (req, res) {
      // caution circular structure with logger attached!
      let p2pcontent = await ipfs_publisher.info(req.query);
      // CORS make no sense for P2P!
      res.header("Access-Control-Allow-Origin", "*");
      res.send(p2pcontent);
  });
  app.get('/history', async function (req, res) {
      // caution circular structure with logger attached!
      let p2pcontent = await ipfs_publisher.history();
      let result = [];
      if((typeof req.query.cid !== 'undefined')&&(req.query.cid == null)) {
        for(let i=0;i<p2pcontent.length;i++) {
          if(p2pcontent[i].uuid == req.query.cid) {
            result.push(p2pcontent[i]);
          }
        }
      } else {
        result = p2pcontent;
      }
      res.header("Access-Control-Allow-Origin", "*");
      res.send(result);
  });
  app.get('/ipfs', async function (req, res) {
        res.header("Access-Control-Allow-Origin", "*");
        const result = await axios.get('https://gateway.pinata.cloud/ipfs/'+req.query.cid);
        res.send(result.data);
  });
  app.get('/republish', async function (req, res) {
      onUpdate(confDir);
      res.send({status:'triggered'});
  });
  app.get('/config', async function (req, res) {
    if(uuids.length == 0) {
      const result = await axios.get(req.query.curl);
      const config = result.data;
      if(typeof config.uuid == 'undefined') {
        console.log('Invalid Config');
        return;
      }
      fs.writeFileSync('./'+config.uuid+'.json',JSON.stringify(config));
      console.log('Wrote: '+config.uuid);
      onUpdate(confDir);
      res.send({status:'triggered'});
    }
  });
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
  uuids = [];
  for(let i=0;i<files.length;i++) {
    if(files[i].indexOf('.json') > 0) {
      try {
        let config = JSON.parse(fs.readFileSync(confpath+"/"+files[i]));
        if((typeof config.name !== 'undefined')&&(typeof config.uuid !== 'undefined')) {
            console.log('Update',config.uuid);
            uuids.push(config.uuid);
            let result = await main.meterLib(msg,config,memStorage);
            if(typeof msgs[config.uuid] == 'undefined') {
                app.use('/'+config.uuid,express.static(process.cwd()+"/node_modules/casa-corrently/public/", {}));
                app.get('/'+config.uuid+'/msg', async function (req, res) {
                    msgs[config.uuid].localHistory =  await ipfs_publisher.history(config.uuid);
                    res.send(msgs[config.uuid]);
                });
                app.get('/'+config.uuid+'/p2p', async function (req, res) {
                    // caution circular structure with logger attached!
                    let p2pcontent = await ipfs_publisher.info(req.query);
                    // CORS make no sense for P2P!
                    res.header("Access-Control-Allow-Origin", "*");
                    res.send(p2pcontent);
                });
                app.get('/'+config.uuid+'/ipfs', async function (req, res) {
                      res.header("Access-Control-Allow-Origin", "*");
                      const result = await axios.get('https://gateway.pinata.cloud/ipfs/'+req.query.cid);
                      res.send(result.data);
                });
                app.get('/'+config.uuid+'/history', async function (req, res) {
                    // caution circular structure with logger attached!
                    let p2pcontent = await ipfs_publisher.history();
                    let result = [];
                    for(let i=0;i<p2pcontent.length;i++) {
                      if(p2pcontent[i].uuid == req.path.substr(1,req.path.indexOf('/history')-1)) {
                        result.push(p2pcontent[i]);
                      }
                    }
                    res.header("Access-Control-Allow-Origin", "*");
                    res.send(result);
                });
            }
            msgs[config.uuid] = result;
            console.log('Update uuid',config.uuid);
            await ipfs_publisher.publish(result,config.uuid);
            console.log('Updated uuid',config.uuid);
        }
      } catch(e) {
        console.log(e);
      }
    }
  }
  if(uuids.length == 0) {
    console.log('Launching Setup Wizzard. Point Browser to: http://localhost:3000/configuration.html');
    app.use('/',express.static(process.cwd()+"/node_modules/casa-corrently/public/", {}));
    app.get('/', async function (req, res) {
      res.redirect('./configuration.html');
    });

  }
  return;
}

const boot = async function() {
  await installCCandUpdate();
  await startLocalIPFSService();

  console.log('Staring WebInterface');
  app.listen(3000);

  confDir = './';
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
