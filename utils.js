'use strict';

const { resolve } = require('path');
const { promisify } = require('util');
const fs = require('fs');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

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

        filenames.forEach((filename) => {
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