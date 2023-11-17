#!/usr/bin/env node
'use strict';

const path = require('path')
const { updateConf } = require('./confHelper');
const help = require('help')(path.resolve(`${__dirname}/usage.txt`));
const { importProperties, exportProperties } = require('./propertiesHelper');
const colors = require('console-colors.js').default;



const [, , ...args] = process.argv;
const SUPPORTED_IMPORT_EXPORT_FORMATS = ['xlsx', 'json'];

switch (args[0]) {
    case '--updateConf':
        updateConf();
        break;
    case '--importProperties':
        var baseCartridgesFolderName = args[1];
        if (!baseCartridgesFolderName) {
            console.log(colors.red('Please provide a baseCartridgesFolderName'));
            break;
        }
        var format = args[2] || 'xlsx';
        if (SUPPORTED_IMPORT_EXPORT_FORMATS.indexOf(format) === -1) {
            console.log(colors.red(`Unsupported format: ${format}`));
            break;
        }
        importProperties(baseCartridgesFolderName, format);
        break;
    case '--exportProperties':
        var baseCartridgesFolderName = args[1];
        if (!baseCartridgesFolderName) {
            console.log(colors.red('Please provide a baseCartridgesFolderName'));
            break;
        }
        var format = args[2] || 'xlsx';
        if (SUPPORTED_IMPORT_EXPORT_FORMATS.indexOf(format) === -1) {
            console.log(colors.red(`Unsupported format: ${format}`));
            break;
        }
        exportProperties(args[1], format);
        break;
    case '--help':
    case '-h':
    default:
        help(1);
}



