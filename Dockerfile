FROM node:lts
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./
RUN npm i
RUN mkdir -p run && mkdir -p run/openems-edge
RUN npm install  --prefix ./run/openems-edge casa-corrently-openems@latest
USER node
COPY --chown=node:node . .
EXPOSE 3000
ENTRYPOINT ["node", "./index.js"]
CMD ["/home/node/app/p2p_sample_config.json"]
