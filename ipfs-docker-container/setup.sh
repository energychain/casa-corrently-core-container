#!/bin/sh

cd ~
curl -sL https://deb.nodesource.com/setup_12.x -o nodesource_setup.sh
sudo bash nodesource_setup.sh
sudo apt install -y nodejs build-essential
npm config set unsafe-perm true
npm install -g casa-corrently-core-container
npm install -g pm2

snap install ipfs
ipfs init

cp ~/ipfs.service /etc/systemd/system/
sudo systemctl start ipfs
sudo systemctl enable ipfs
