#!/bin/sh
# Perform auto restarts in case of exit(2) = Update check

until node ./index.js /home/node/app/openems_sample_config.json;sleep 10;./node_modules/pm2/bin/pm2 l
do
  sleep 1
done
