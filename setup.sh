#!/bin/sh

apt install -y build-essential make gcc g++

curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get install -y nodejs

npm install -g pm2; npm install -g casa-corrently-core-container --unsafe-perm

mkdir /etc/casa-corrently/;cd /etc/casa-corrently

pm2 start -n casa-corrently --time --max-memory-restart 204800000 --cwd /etc/casa-corrently -c '9 3 * * *' casa-corrently-container
