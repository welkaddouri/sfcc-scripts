'use strict';

const fs = require('fs');
const glob = require('glob');
const readXlsxFile = require('xlsx');
const xl = require('excel4node');
const colors = require('console-colors.js').default;

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



const importProperties = (baseCartridgesFolderName) => {
    if (!baseCartridgesFolderName) {
        console.log(colors.red('Please provide a baseCartridgesFolderName'));
        return;
    }

    glob(`./${baseCartridgesFolderName}/cartridges/**/resources/`, async (err, res) => {
        if (err) {
            console.log('Error', err);
        } else {

            let jsonSheetObject;
            let changeOccured = false;
            let lines, splitedLines, keys, values;
            let newContent;
            let cartridgeName;
            let workbook;

            for (let k = 0; k < res.length; k++) {
                cartridgeName = res[k].split('/')[3];

                try {
                    workbook = readXlsxFile.readFile(`./${cartridgeName}.xlsx`);
                } catch (e) {
                    console.log(colors.red(`${cartridgeName}.xlsx not found`));
                    continue;
                }

                await readFiles(res[k], (filename, content) => {
                    let { sheetName, columnName } = getSheetNameAndColumnName(filename.replace('.properties', ''));

                    if (columnName === 'Default') {
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
                                newContent = newContent.concat(`${key}=${value}\n`);
                                changeOccured = true;
                            }
                        }
                    }

                    if (changeOccured) {

                        fs.writeFileSync(res[k] + filename, newContent, (err) => {
                            if (err) {
                                console.log(colors.red(`Error writing file ${res[k] + filename}`));
                                return;
                            }
                            console.log(colors.green(`${filename} updated`));
                        })
                    } else {
                        console.log(colors.blue(`no changes occured in ${filename}`));
                    }

                }, (err) => {
                    console.log(colors.red(err.message));
                }, () => {
                    console.log(colors.green(`${cartridgeName} properties files updated`));
                });
            }
        }
    });
}

const exportProperties = (baseCartridgesFolderName) => {
    if (!baseCartridgesFolderName) {
        console.log(colors.red('Please provide a baseCartridgesFolderName'));
        return;
    }
    glob(`./${baseCartridgesFolderName}/cartridges/**/resources/`, async (err, res) => {
        if (err) {
            console.log(colors.red('Please provide a valid baseCartridgesFolderName'));
            return;
        }

        if (res.length === 0) {
            console.log(colors.red('No resources files found'));
            return;
        }

        let cartridgeName;
        let wb = new xl.Workbook();

        var styleTitle = wb.createStyle(TITLE_SHEET_CONF);

        var styleLineEven = wb.createStyle(EVEN_ROW_CONF);

        var styleLineOdd = wb.createStyle(ODD_ROW_CONF);

        var styleLineError = wb.createStyle(ERROR_CELL_CONF);

        let sheetName, ws, maxLength, keys, column;

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
                wb.write(`${cartridgeName}.xlsx`);
                console.log(colors.green(`${cartridgeName}.xlsx created or updated`));
            });
        }

    });
}

const getSheetNameAndColumnName = (fileName) => {
    let localeSeparatorIndex = fileName.indexOf('_');
    if (localeSeparatorIndex === -1) {
        return {
            sheetName: fileName,
            columnName: 'Default'
        }
    } else {
        return {
            sheetName: fileName.substring(0, localeSeparatorIndex),
            columnName: fileName.substring(localeSeparatorIndex + 1)
        }
    }
}

module.exports = { importProperties, exportProperties };