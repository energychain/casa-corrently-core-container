# casa-corrently-core-container
Container service to run and manage local instance of Casa Corrently Energy Cost Monitoring. Use it to manage //boxes// at edges.

![npm](https://img.shields.io/npm/dw/casa-corrently-core-container) [![Build Status](https://travis-ci.com/energychain/casa-corrently-core-container.svg?branch=master)](https://travis-ci.com/energychain/casa-corrently-core-container) [![Code Quality](https://www.code-inspector.com/project/12872/score/svg)](https://frontend.code-inspector.com/public/project/12872/casa-corrently-core-container/dashboard) [![chat](https://img.shields.io/badge/chat-support-brightgreen)](https://tawk.to/chat/5c53189451410568a109843f/default)


## QuickStart
You might deploy your personal test environment easily using [this Heroku deployment template](
https://heroku.com/deploy?template=https://github.com/energychain/casa-corrently-core-container).

## Installation

### Prerequisites
- npm and Node JS (version 12 recommended)

###  via Shell
```shell
git clone https://github.com/energychain/casa-corrently-core-container casa-corrently
cd casa-corrently
npm config set unsafe-perm true
npm install
```

### using pm2
Container management is done using pm2.


## Usage
Configure settings in `sample_config.json` to your needs.

```shell
npm start ./sample_config.json
```

## Funding
This module is part of the Corrently Ecosystem which looks for funding in Germany:  https://www.stromdao.de/crowdfunding/info
![STROMDAO - Corrently Crowdfunding](https://squad.stromdao.de/nextcloud/index.php/s/Do4pzpM7KndZxAx/preview)

## Further reading
Further Documentation is available as Casa Corrently Chapter at: https://casa.corrently.de/books/nutzung-von-node-red/chapter/gr%C3%BCnstromz%C3%A4hler-%28discovergy-meter%29

## Maintainer / Imprint
This module is not an official contribution by Influx.

<addr>
STROMDAO GmbH  <br/>
Gerhard Weiser Ring 29  <br/>
69256 Mauer  <br/>
Germany  <br/>
  <br/>
+49 6226 968 009 0  <br/>
  <br/>
kontakt@stromdao.com  <br/>
  <br/>
Handelsregister: HRB 728691 (Amtsgericht Mannheim)
</addr>


## LICENSE
Apache-2.0
