const pm2 = require('pm2');
const fs = require('fs');

const launchContainer = async function(launchers) {
  pm2.connect(async function(err) {
    if (err) {
      console.error(err);
      process.exit(2);
    }
    for(let i=0;i<launchers.length;i++) {
      try {
        fs.mkdirSync(launchers[i].cwd);
      } catch(e) {}
      try {
        fs.mkdirSync(launchers[i].cwd+launchers[i].name);
      } catch(e) {}
      fs.writeFileSync(launchers[i].cwd+launchers[i].name+'/package.json',JSON.stringify({
          "name": "casa-corrently-"+launchers[i].name,
          "version": "0.0.1"
      }));
      pm2.start(launchers[i], function(err, apps) {
        pm2.disconnect();   // Disconnects from PM2
        if (err) throw err
      });
    }
  });
};

const relaunchContainer = async function(launchers) {

}
const fileExists = async path => !!(await fs.promises.stat(path).catch(e => false));

const boot = async function() {
  let launchers  = [];
  let configjson = __dirname+'/sample_config.json';
  let selectedlauncher = 'cloud-edge';
  if(await fileExists(__dirname+'/config.json')) {
      configjson = __dirname+'/config.json';
  }
  if(process.argv.length > 2) {
    if(await fileExists(process.argv[2])) {
        configjson = process.argv[2];
    }
  }
  if(process.argv.length > 3) {
    if(await fileExists(process.argv[3])) {
        selectedlauncher = process.argv[3];
    }
  }
  if(selectedlauncher == 'openems-edge') {
    launchers.push({
      'name'       : 'openems-edge',
      'script'    : 'npm install;npm ci;node ./app.js '+configjson,         // Script to be run
      'execMode' : 'fork',        // Allows your app to be clustered
      max_memory_restart : '200M',   // Optional: Restarts your app if it reaches 100Mo
      'cwd'     : './openems/',
    });
  }
if(selectedlauncher == 'ipfs-edge') {
  launchers.push({
    'name'       : 'ipfs-edge',
    'script'    : 'npm install;npm ci;node ./standalone.js '+configjson,         // Script to be run
    'execMode' : 'fork',        // Allows your app to be clustered
    max_memory_restart : '300M',   // Optional: Restarts your app if it reaches 100Mo
    'cwd'     : './ipfs/',
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
  launchContainer(launchers);
  setInterval(function() {
    launchContainer(launchers);
  },86400000);
}

boot();
