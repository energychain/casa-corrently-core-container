# casa-corrently-core-container
Container service to run and manage local instance of Casa Corrently Energy Cost Monitoring. Use it to manage *boxes* at edges.

![npm](https://img.shields.io/npm/dw/casa-corrently-core-container) [![Build Status](https://travis-ci.com/energychain/casa-corrently-core-container.svg?branch=master)](https://travis-ci.com/energychain/casa-corrently-core-container) [![Code Quality](https://www.code-inspector.com/project/12872/score/svg)](https://frontend.code-inspector.com/public/project/12872/casa-corrently-core-container/dashboard) [![chat](https://img.shields.io/badge/chat-support-brightgreen)](https://tawk.to/chat/5c53189451410568a109843f/default)

This module will ensure that your configured processes like the casa corrently webinterface, openems edge etc... run and get updated as soon as a new release comes out. It provides detailed login via [pm2](https://pm2.io/) and monitors RAM usage of sub processes.

## Installation

### Prerequisites
- npm and Node JS (version 12 recommended)

###  via Shell
```shell
npm install -g casa-corrently-core-container
```
- On a Raspberry PI install takes about 10 minutes

## Usage

```shell
casa-corrently-container /some/path/config.json
```

### Notes
- Ensure you have a launcher set in your `config.json` file!
- Use a full path (not a relative path) to start it
- If you have pm2 installed - you might use it to start the container itself.

### Logging
Logfiles get created per service you might monitor them via:
`pm2 logs`

or find them in:
`~/.pm2/logs/`

## Supported Flavors
 - (OpenEMS-Edge)[https://github.com/energychain/casa-corrently-openems] as of V0.5.26
 - (Cloud-Edge)[https://github.com/energychain/casa-corrently-webinterface] as of V1.0.25


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
