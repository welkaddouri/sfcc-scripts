const colors = require('console-colors.js').default
const fs = require('fs');
const {getConfFiles} = require('./utils');

const confFileName = "dw.json";
const currentDir = process.cwd();

let sourceConf;

let updateConf = () => {
    try {
        sourceConf = JSON.stringify(require(`${currentDir}/${confFileName}`), null, 2);
    } catch(e) {
        if (e.code === 'MODULE_NOT_FOUND') {
            console.log(colors.red(`${confFileName} file not found in the top project directory`));
        } else {
            console.log(colors.red(`${confFileName} is not a json file`));
        }
        return;
    }

    getConfFiles(currentDir)
        .then(files => {
            files.forEach(file => {
                fs.writeFileSync(file, sourceConf);
            });
            console.log(colors.green(`${confFileName} is successfully updated on all cartridges`));
        });
}

module.exports = { updateConf };