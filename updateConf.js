
const { promisify } = require('util');
const { resolve } = require('path');
const fs = require('fs');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const confFileName = "dw.json";
const currentDir = process.cwd();

let sourceConf;


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



let updateConf = () => {
    try {
        sourceConf = JSON.stringify(require(`${currentDir}/${confFileName}`), null, 2);
    } catch(e) {
        if (e.code === 'MODULE_NOT_FOUND') {
            console.error(`${confFileName} file not found in the top project directory`);
        } else {
            console.error(`${confFileName} is not a json file`);
        }
        return;
    }

    getConfFiles(currentDir)
        .then(files => {
            files.forEach(file => {
                fs.writeFileSync(file, sourceConf);
            });
            console.info(`${confFileName} is successfully updated on all cartridges`);
        });
}

module.exports = { updateConf };