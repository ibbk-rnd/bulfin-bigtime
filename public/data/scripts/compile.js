const { normalizeFile } = require('./normalizer');
const fs = require('fs');

const files = [
  ['../gdp', 'bgn.json'],
  ['../tax', 'tax.json'],
  ['../gross-national-debt', 'euro.json'],
  ['../gross-national-debt', 'gdp.json'],
  ['../gross-external-debt', 'euro.json'],
  ['../government-deficit-and-surplus', 'bgn.json'],
  ['../government-deficit-and-surplus', 'gdp.json'],
  ['../gini-coefficient', 'gini-coefficient.json'],
  ['../hicp', 'HICP.json'],
  ['../budget-nzok', 'budget-nzok.json'],
  ['../national-budget', 'national-budget.json'],
  ['../other', 'other.json'],
];

const commonSources = fs.readFileSync('../common-links.json', 'utf8');
let commonData = JSON.parse(commonSources);
let compiledFiles = [];

files.forEach((file) => {
  normalizeFile(`./${file[0]}/raw/${file[1]}`, `./${file[0]}/${file[1]}`, commonData);
  compiledFiles.push(`./${file[0]}/${file[1]}`);
});

function combineJsonFiles(filePaths) {
  const combinedData = [];

  for (const filePath of filePaths) {
    console.log(filePath);
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data);

      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          combinedData.push(item);
        });
      } else {
        combinedData.push(parsed);
      }
    } catch (error) {
      console.error(`Error reading or parsing file ${filePath}:`, error);
    }
  }

  return combinedData;
}

fs.writeFile('../charts.json', JSON.stringify(combineJsonFiles(compiledFiles), null, 2) + '\n', (err) => {
  if (err) {
    console.error('Error writing to the file:', err);
  } else {
    console.log('File written successfully!');
  }
});
