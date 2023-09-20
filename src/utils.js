'use strict';

const { resolve } = require('path');
const { promisify } = require('util');
const fs = require('fs');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const confFileName = "dw.json";

async function getConfFiles(dir) {
    const subdirs = await readdir(dir);
    const files = await Promise.all(subdirs.map(async (subdir) => {
        const res = resolve(dir, subdir);
        if ((await stat(res)).isDirectory()) {
            if (fs.existsSync(res + "/" + confFileName)) {
                return res + "/" + confFileName;
            } else {
                return getConfFiles(res);
            }
        }
    }));
    return files.reduce((a, f) => a.concat(f), []).filter(a => !!a);
}

let readFiles = (dirname, onFileContent, onError, onFinish) => {
    fs.readdir(dirname, (err, filenames) => {
        if (err) {
            err.message = `Error reading ${dirname}: ${err.message}`;
            onError(err);
            return;
        }
        
        filenames.sort((filename1, filename2) => {
            var fileCat1 = filename1.split('_')[0].replace('.properties', '');
            var fileCat2 = filename2.split('_')[0].replace('.properties', '');
            if (fileCat1 == fileCat2) {
                return 0;
            } else {
                return fileCat1 > fileCat2 ? 1 : -1;
            }
        }).forEach((filename) => {
            try {
                var content = fs.readFileSync(dirname + filename, 'utf8')
                onFileContent(filename, content);
            } catch (err) {
                err.message = `Error reading ${dirname}/${filename}: ${err.message}`;
                onError(err);
                return;
            }
        });
        onFinish();
    });
}

module.exports = { getConfFiles, readFiles };