#!/usr/bin/env node

const pm2 = require('pm2');
const fs = require('fs');
const axios = require('axios');

const launchContainer = async function(launchers,taskid) {
  pm2.connect(async function(err) {
    if (err) {
      console.error(err);
      process.exit(2);
    }
    for(let i=0;i<launchers.length;i++) {

      try {
        fs.mkdirSync(launchers[i].cwd+launchers[i].name);
      } catch(e) {}
      fs.writeFileSync(launchers[i].cwd+launchers[i].name+'/package.json',JSON.stringify({
          "name": "casa-corrently-"+launchers[i].name+"-"+taskid,
          "version": "0.0.1"
      }));
      launchers[i].name += '-' + taskid;
      pm2.start(launchers[i], function(err, apps) {
        pm2.disconnect();   // Disconnects from PM2
        if (err) throw err
      });
    }
  });
};

const fileExists = async path => !!(await fs.promises.stat(path).catch(e => false));

const bootSingle = async function() {
  let launchers  = [];
  let configjson = __dirname+'/sample_config.json';

  if(await fileExists(__dirname+'/config.json')) {
      configjson = __dirname+'/config.json';
  }
  if(process.argv.length > 2) {
    if(await fileExists(process.argv[2])) {
        configjson = process.argv[2];
    }
    if(process.argv[2].substr(0,8) == "https://") {
      let res = await axios.get(process.argv[2]);
      configjson = './config.json';
      fs.writeFileSync('./config.json',JSON.stringify(res.data));
    }
    if(process.argv[2].substr(0,7) == "http://") {
      let res = await axios.get(process.argv[2]);
      configjson = './config.json';
      fs.writeFileSync('./config.json',JSON.stringify(res.data));
    }
  } else {
    const fromin = fs.readFileSync(0, 'utf-8');
    fs.writeFileSync('./config.json',fromin);
  }
  if(await fileExists('./config.json')) {
      configjson = './config.json';
  }

  console.log('Runtime Configuration: ',configjson);
  let selectedlauncher = 'cloud-edge';
  let tmpconfig = JSON.parse(fs.readFileSync(configjson));
  taskid = tmpconfig.uuid;
  if(typeof tmpconfig.uuid == 'undefined') taskid = 'unknown';

  try {
    fs.mkdirSync('./run');
  } catch(e) {}
  fs.writeFileSync('./run/config-'+taskid+'.json',JSON.stringify(tmpconfig));

  if(typeof tmpconfig.launcher !== 'undefined') {
    selectedlauncher = tmpconfig.launcher;
  }

  configjson = process.cwd() + '/run/config-'+taskid+'.json';

  if(process.argv.length > 3) {
      selectedlauncher = process.argv[3];
  }
  console.log('Runtime Launcher: ',selectedlauncher);
  if(selectedlauncher == 'openems-edge') {
    launchers.push({
      'name'       : 'openems-edge',
      'script'    : 'npm install  --prefix ./openems-edge casa-corrently-openems@latest;node ./openems-edge/node_modules/casa-corrently-openems/app.js  '+configjson,         // Script to be run
      'execMode' : 'fork',        // Allows your app to be clustered
      max_memory_restart : '200M',   // Optional: Restarts your app if it reaches 100Mo
      'cwd'     : './run/',
    });
  }
if(selectedlauncher == 'ipfs-edge') {
  launchers.push({
    'name'       : 'ipfs-edge',
    'script'    : 'npm install --prefix ./ipfs-edge casa-corrently-ipfs-edge@latest;node ./ipfs-edge/node_modules/casa-corrently-ipfs-edge/standalone.js '+configjson,         // Script to be run
    'execMode' : 'fork',        // Allows your app to be clustered
    max_memory_restart : '300M',   // Optional: Restarts your app if it reaches 100Mo
    'cwd'     : './run/',
  });
}
if(selectedlauncher == 'p2p-edge') {
  launchers.push({
    'name'       : 'p2p-edge',
    'script'    : 'npm install --prefix ./p2p-edge casa-corrently@latest;npm install --prefix ./p2p-edge casa-corrently-ipfs-edge@latest;node ./p2p-edge/node_modules/casa-corrently/standalone.js '+configjson,         // Script to be run
    'execMode' : 'fork',        // Allows your app to be clustered
    max_memory_restart : '300M',   // Optional: Restarts your app if it reaches 100Mo
    'cwd'     : './run/',
  });
}
if(selectedlauncher == 'cloud-edge') {
  launchers.push({
    'name'       : 'cloud-edge',
    'script'    : 'npm install --prefix ./cloud-edge casa-corrently@latest;node ./cloud-edge/node_modules/casa-corrently/standalone.js '+configjson,         // Script to be run
    'execMode' : 'fork',        // Allows your app to be clustered
    max_memory_restart : '300M',   // Optional: Restarts your app if it reaches 100Mo
    'cwd'     : './run/',
  });
}
launchContainer(launchers,taskid);
setInterval(function() {
    launchContainer(launchers,taskid);
  },86400000);
 return;
}

bootSingle();
