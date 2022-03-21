#!/usr/bin/env node

const { updateConf } =  require('./updateConf');


const [, , ...args] = process.argv;

if (args[0] === '--updateConf') {
    updateConf();
}

