#!/usr/bin/env node

const fileExists = async path => !!(await fs.promises.stat(path).catch(e => false));
const fs = require('fs');
const { exec } = require("child_process");
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const axios = require("axios");
app.use(bodyParser.urlencoded({ extended: true }));
let wwwroot = '';
let msgs = {};
let confDir = './';
let uuids = [];
let updateCnt = 0;
let services = [];

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
          "casa-corrently-openems": "*",
          "casa-corrently-influxdb-source": "*"
        }
    }));
  await execShellCommand('npm install');
  await execShellCommand('npm update');
  await execShellCommand('npm ci');
  return
}

const startLocalIPFSService = async function() {
  console.log('Starting IPFS Service');
  ipfs_publisher = require(process.cwd()+"/node_modules/casa-corrently-ipfs-edge/index.js")({uuid:'ipfs-node-edge2',name:'ipfs-node',remoteHistory:true});
  app.get(wwwroot+'/.json', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.send(uuids);
  });
  app.get(wwwroot+'/p2p', async function (req, res) {
      // caution circular structure with logger attached!
      let p2pcontent = await ipfs_publisher.info(req.query);
      // CORS make no sense for P2P!
      res.header("Access-Control-Allow-Origin", "*");
      res.send(p2pcontent);
  });
  app.get(wwwroot+'/history', async function (req, res) {
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
  app.get(wwwroot+'/ipfs', async function (req, res) {
        res.header("Access-Control-Allow-Origin", "*");
        const result = await axios.get('https://gateway.ipfs.io/ipfs/'+req.query.cid);
        res.send(result.data);
  });
  app.get(wwwroot+'/republish', async function (req, res) {
      onUpdate(confDir);
      res.send({status:'triggered'});
  });
  app.get(wwwroot+'/config', async function (req, res) {
    if(uuids.length == 0) {
      const result = await axios.get(req.query.curl);
      const config = result.data;
      if(typeof config.uuid == 'undefined') {
        console.log('Invalid Config');
        return;
      }
      if(!fs.existsSync('./'+config.uuid+'.json')) {
        fs.writeFileSync('./'+config.uuid+'.json',JSON.stringify(config));
        console.log('Wrote: '+config.uuid);
      }
      onUpdate(confDir);
      res.send({status:'triggered'});
    }
  });
  return;
}

const onUpdate = async function(confpath) {
  const CasaCorrently = require(process.cwd()+"/node_modules/casa-corrently/app.js");
  updateCnt++;

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
            console.log('Update',config.uuid,updateCnt);
            uuids.push(config.uuid);
            let result = await main.meterLib(msg,config,memStorage);
            if(typeof msgs[config.uuid] == 'undefined') {
                app.use(wwwroot+'/'+config.uuid,express.static(process.cwd()+"/node_modules/casa-corrently/public/", {}));
                app.get(wwwroot+'/'+config.uuid+'/msg', async function (req, res) {
                    msgs[config.uuid].localHistory =  await ipfs_publisher.history(config.uuid);
                    res.send(msgs[config.uuid]);
                });
                app.get(wwwroot+'/'+config.uuid+'/p2p', async function (req, res) {
                    // caution circular structure with logger attached!
                    let p2pcontent = await ipfs_publisher.info(req.query);
                    // CORS make no sense for P2P!
                    res.header("Access-Control-Allow-Origin", "*");
                    res.send(p2pcontent);
                });
                app.get(wwwroot+'/'+config.uuid+'/ipfs', async function (req, res) {
                      res.header("Access-Control-Allow-Origin", "*");
                      const result = await axios.get('https://gateway.pinata.cloud/ipfs/'+req.query.cid);
                      res.send(result.data);
                });
                app.get(wwwroot+'/'+config.uuid+'/history', async function (req, res) {
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
            await ipfs_publisher.publish(result,config.uuid);
        } else {
          // is backend Service
          if((updateCnt<2)&&(typeof config.module !== 'undefined')) {
              console.log("Starting Edge Service",config.module);
              let env = {
                app: app
              };
              const module = require(config.module);
              services.push(new module(config,env));
          }
        }
      } catch(e) {
        console.log(e);
      }
    }
  }
  console.log('Launching Setup Wizzard. Point Browser to: http://localhost:3000/configuration.html');
  app.use(wwwroot+'/node/',express.static(process.cwd()+"/node_modules/casa-corrently/public/", {}));
  app.get(wwwroot+'/', async function (req, res) {
    console.log(wwwroot+'/');
    if(typeof req.query.eA == 'undefined') {
      res.redirect('/node/login.html');
    } else {
      res.redirect('/node/configuration.html');
    }
  });

  return;
}

const boot = async function() {
  console.log('Staring WebInterface');
  let port = process.env.PORT || 3000;
  wwwroot = process.env.wwwroot || '';

  app.listen(port);

  await installCCandUpdate();
  await startLocalIPFSService();

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
