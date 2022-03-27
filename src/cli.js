#!/usr/bin/env node
'use strict';

const path = require('path')
const { updateConf } = require('./confHelper');
const help = require('help')(path.resolve(`${__dirname}/usage.txt`));
const { importProperties, exportProperties } = require('./propertiesHelper');



const [, , ...args] = process.argv;

switch (args[0]) {
    case '--updateConf':
        updateConf();
        break;
    case '--importProperties':
        importProperties(args[1]);
        break;
    case '--exportProperties':
        exportProperties(args[1]);
        break;
    case '--help':
    case '-h':
    default:
        help(1);
}



