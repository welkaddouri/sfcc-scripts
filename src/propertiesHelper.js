'use strict';

const fs = require('fs');
const glob = require('glob');
const readXlsxFile = require('xlsx');
const xl = require('excel4node');
const colors = require('console-colors.js').default;
const DEFAULT_LOCALE = 'Default';

const { readFiles } = require('./utils');


const TITLE_SHEET_CONF = {
    font: {
        color: '#000000',
        size: 12,
    },
    fill: {
        type: 'pattern',
        patternType: 'solid',
        fgColor: '#70ad47'
    },
    border: { // §18.8.4 border (Border)
        top: {
            style: 'medium',
            color: "#CCCCCC"
        },
        bottom: {
            style: 'medium',
            color: "#CCCCCC"
        },
        outline: false
    },
};

const ODD_ROW_CONF = {
    font: {
        color: '#000000',
        size: 12,
    },
    fill: {
        type: 'pattern',
        patternType: 'solid',
        fgColor: '#f9fbf7'
    },
    border: {
        top: {
            style: 'medium',
            color: "#CCCCCC"
        },
        bottom: {
            style: 'medium',
            color: "#CCCCCC"
        },
        outline: false
    },
};

const EVEN_ROW_CONF = {
    font: {
        color: '#000000',
        size: 12,
    },
    fill: {
        type: 'pattern',
        patternType: 'solid',
        fgColor: '#e2efda'
    },
    border: {
        top: {
            style: 'medium',
            color: "#CCCCCC"
        },
        bottom: {
            style: 'medium',
            color: "#CCCCCC"
        },
        outline: false
    },
};

const ERROR_CELL_CONF = {
    fill: {
        type: 'pattern',
        patternType: 'solid',
        fgColor: 'red'
    },
    font: {
        color: '#000000',
        size: 12,
    }
};



const importProperties = (baseCartridgesFolderName, format) => {
    glob(`./${baseCartridgesFolderName}/cartridges/**/resources/`, async (err, res) => {
        if (err) {
            console.log('Error', err);
        } else {
            if (format === 'xlsx') {
                await importFromXlsx(res);
            }

            if (format === 'json') {
                await importFromJson(res);
            }
        }
    });
}

const exportProperties = (baseCartridgesFolderName, format) => {
    glob(`./${baseCartridgesFolderName}/cartridges/**/resources/`, async (err, res) => {
        if (err) {
            console.log(colors.red('Please provide a valid baseCartridgesFolderName'));
            return;
        }

        if (res.length === 0) {
            console.log(colors.red('No resources files found'));
            return;
        }

        if (format === 'xlsx') {
            await exportToXlsx(res);
        }

        if (format === 'json') {
            await exportToJson(res);
        }

    });
}


const importFromXlsx = async (res) => {
    let jsonSheetObject;
    let changeOccured = false;
    let format = 'xlsx';
    let lines, splitedLines, keys, values;
    let newContent;
    let cartridgeName;
    let workbook;

    for (let k = 0; k < res.length; k++) {
        cartridgeName = res[k].split('/')[3];

        try {
            workbook = readXlsxFile.readFile(`./${cartridgeName}.${format}`);
        } catch (e) {
            console.log(colors.red(`${cartridgeName}.${format} not found`));
            continue;
        }

        await readFiles(res[k], (filename, content) => {
            let { sheetName, columnName } = getSheetNameAndColumnName(filename.replace('.properties', ''));

            if (columnName === DEFAULT_LOCALE) {
                jsonSheetObject = readXlsxFile.utils.sheet_to_json(workbook.Sheets[sheetName]);
            }

            lines = content.split("\n").filter((l) => l.length && l.indexOf('=') != -1);


            splitedLines = lines
                .map((l) => l.split('='))
                .map((l) => l.map((e) => e.trim()));
            keys = splitedLines.map((l) => l[0]);
            values = splitedLines.map((l) => l[1]);


            newContent = content;
            changeOccured = false;
            let key, value, keyPosition;

            for (let j = 0; j < jsonSheetObject.length; j++) {
                key = jsonSheetObject[j].Key;
                value = jsonSheetObject[j][columnName];
                keyPosition = keys.indexOf(key);

                if (keyPosition !== -1) {
                    if (value && value !== values[keyPosition]) {
                        newContent = newContent.replace(lines[keyPosition], `${key}=${value}`);
                        changeOccured = true;
                    }
                } else {
                    if (value) {
                        newContent = newContent.concat(`\n${key}=${value}`);
                        changeOccured = true;
                    }
                }
            }

            if (changeOccured) {
                fs.writeFileSync(res[k] + filename, newContent);
                console.log(colors.green(`${filename} updated`));
            }

        }, (err) => {
            console.log(colors.red(err.message));
        }, () => {
            console.log(colors.green(`${cartridgeName} properties files updated`));
        });
    }
}

const importFromJson = async (res, jsonObject) => {
    let changeOccured = false;
    let format = 'json';
    let lines, splitedLines, keys, values;
    let newContent;
    let cartridgeName;

    for (let k = 0; k < res.length; k++) {
        cartridgeName = res[k].split('/')[3];
        
        if (!jsonObject) {
            try {
                jsonObject = JSON.parse(fs.readFileSync(`./${cartridgeName}.${format}`));
            } catch (e) {
                console.log(colors.red(`${cartridgeName}.${format} not found`));
                continue;
            }
        }

        await readFiles(res[k], (filename, content) => {
            let { sheetName, columnName } = getSheetNameAndColumnName(filename.replace('.properties', ''));

            if (!jsonObject[sheetName]) {
                return;
            }

            lines = content.split("\n").filter((l) => l.length && l.indexOf('=') != -1);


            splitedLines = lines
                .map((l) => l.split('='))
                .map((l) => l.map((e) => e.trim()));
            keys = splitedLines.map((l) => l[0]);
            values = splitedLines.map((l) => l[1]);


            newContent = content;
            changeOccured = false;
            let key, value, keyPosition;
            let keysFromJson = Object.keys(jsonObject[sheetName]);

            for (let j = 0; j < keysFromJson.length; j++) {
                key = keysFromJson[j].split('__')[0];
                value = jsonObject[sheetName][`${key}__${columnName}`];
                keyPosition = keys.indexOf(key);

                if (keyPosition !== -1) {
                    if (value && value !== values[keyPosition]) {
                        newContent = newContent.replace(lines[keyPosition], `${key}=${value}`);
                        changeOccured = true;
                    }
                } else {
                    if (value) {
                        newContent = newContent.concat(`\n${key}=${value}`);
                        changeOccured = true;
                    }
                }
                delete jsonObject[sheetName][`${key}__${columnName}`];
            }

            if (Object.keys(jsonObject[sheetName]).length === 0) {
                delete jsonObject[sheetName];
            }

            if (changeOccured) {
                fs.writeFileSync(res[k] + filename, newContent);
                console.log(colors.green(`${filename} updated`));
            }

        }, (err) => {
            console.log(colors.red(err.message));
        }, () => {
            var fileToCreate;
            var filesToCreate = [];
            Object.keys(jsonObject).forEach((sheetName) => {
                Object.keys(jsonObject[sheetName]).forEach((key) => {
                    fileToCreate = res[k] + sheetName + (key.split('__')[1] === DEFAULT_LOCALE ? '' : `_${key.split('__')[1]}`) + '.properties';
                    if (filesToCreate.indexOf(fileToCreate) === -1) {
                        console.log(colors.green(`creating new file ${fileToCreate}`));
                        filesToCreate.push(fileToCreate);
                        fs.writeFileSync(fileToCreate, '');
                    }
                });
            })
            if (filesToCreate.length) {
                importFromJson([res[k]], jsonObject);
            } else {
                console.log(colors.green(`${cartridgeName} properties files updated`));
            }
        });
    }
}

const exportToXlsx = async (res) => {
    let wb = new xl.Workbook();
    let format = 'xlsx';
    var styleTitle = wb.createStyle(TITLE_SHEET_CONF);

    var styleLineEven = wb.createStyle(EVEN_ROW_CONF);

    var styleLineOdd = wb.createStyle(ODD_ROW_CONF);

    var styleLineError = wb.createStyle(ERROR_CELL_CONF);

    let sheetName, ws, maxLength, keys, column, cartridgeName;

    const getRow = (column, j, key) => {
        if (column == 2) {
            return j + 2;
        } else {
            return keys.indexOf(key) + 2;
        }
    }

    const addKeyCell = (key, keys, column) => {
        if (keys.indexOf(key) == -1) {
            ws.cell(keys.length + 2, 1).string(key).style(keys.length % 2 === 0 ? styleLineEven : styleLineOdd);
            keys.push(key);
        } else {
            if (column == 2) {
                ws.cell(keys.length + 2, 1).string(key).style(keys.length % 2 === 0 ? styleLineEven : styleLineError);
                keys.push(key);
            }
        }
    }

    const addValueCell = (value, row, column) => {
        if (value) {
            ws.cell(row, column).string(value).style(row % 2 === 0 ? styleLineEven : styleLineOdd);
        } else {
            ws.cell(row, column).style(styleLineError);
        }
    }

    const createSheetOrAddLocaleColumn = (sheetName, column) => {
        var localeSeparatorIndex = sheetName.indexOf('_');
        if (localeSeparatorIndex == -1) {
            column = 2;
            ws = wb.addWorksheet(sheetName);
            ws.cell(1, 1).string("Key").style(styleTitle);
            ws.cell(1, column).string("Default").style(styleTitle);
            ws.column(1).setWidth(50);
            keys = [];
        } else {
            column++;
            ws.cell(1, column).string(sheetName.substring(localeSeparatorIndex + 1)).style(styleTitle);
        }
        return column;
    }

    for (let k = 0; k < res.length; k++) {
        cartridgeName = res[k].split('/')[3];
        await readFiles(res[k], (filename, content) => {
            maxLength = 10;
            sheetName = filename.replace('.properties', '');
            column = createSheetOrAddLocaleColumn(sheetName, column);

            let lines = content.split("\n").filter((l) => l.length && l.indexOf('=') != -1);
            var separator, key, value, row;


            for (let j = 0; j < lines.length; j++) {
                separator = lines[j].indexOf('=');
                if (separator !== -1) {
                    key = lines[j].substring(0, separator).trim();
                    value = lines[j].substring(separator + 1).trim();

                    addKeyCell(key, keys, column);

                    row = getRow(column, j, key);

                    addValueCell(value, row, column);

                    if (maxLength < value.length) {
                        maxLength = value.length;
                    }
                }
            }

            ws.column(column).setWidth(maxLength);
        }, (err) => {
            console.log(colors.red(err.message));
        }, () => {
            wb.write(`${cartridgeName}.${format}`);
            console.log(colors.green(`${cartridgeName}.${format} created or updated`));
        });
    }
}

const exportToJson = async (res) => {
    var globalObject = {};
    var format = 'json';
    var sheetNameWithLocale, locale, sheetName, cartridgeName;
    for (let k = 0; k < res.length; k++) {
        cartridgeName = res[k].split('/')[3];
        await readFiles(res[k], (filename, content) => {
            sheetNameWithLocale = filename.replace('.properties', '').split('_');
            sheetName = sheetNameWithLocale.shift();
            locale = sheetNameWithLocale.join('_') || DEFAULT_LOCALE;

            if (!globalObject[sheetName]) {
                globalObject[sheetName] = {};
            }

            let lines = content.split("\n").filter((l) => l.length && l.indexOf('=') != -1);
            var separator, key, value;


            for (let j = 0; j < lines.length; j++) {
                separator = lines[j].indexOf('=');
                if (separator !== -1) {
                    key = lines[j].substring(0, separator).trim();
                    value = lines[j].substring(separator + 1).trim();
                    globalObject[sheetName][`${key}__${locale}`] = value;
                }
            }
        }, (err) => {
            console.log(colors.red(err.message));
        }, () => {
            fs.writeFile(`${cartridgeName}.${format}`, JSON.stringify(globalObject, null, 2), (err) => {
                if (err) {
                    console.log(colors.red(err.message));
                } else {
                    console.log(colors.green(`${cartridgeName}.${format} created or updated`));
                }
            });
        });
    }
}

const getSheetNameAndColumnName = (fileName) => {
    let localeSeparatorIndex = fileName.indexOf('_');
    if (localeSeparatorIndex === -1) {
        return {
            sheetName: fileName,
            columnName: DEFAULT_LOCALE
        }
    } else {
        return {
            sheetName: fileName.substring(0, localeSeparatorIndex),
            columnName: fileName.substring(localeSeparatorIndex + 1)
        }
    }
}

module.exports = { importProperties, exportProperties };