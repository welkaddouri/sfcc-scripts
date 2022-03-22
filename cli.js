#!/usr/bin/env node

const { updateConf } =  require('./updateConf');
const help = require('help')('usage.txt')


const [, , ...args] = process.argv;

switch (args[0]) {
    case '--updateConf':
        updateConf();
    default:
        help(0);    
}



