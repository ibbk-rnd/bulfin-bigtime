const { normalizeFile } = require('./normalizer');

const files = [
  ['../gdp', 'bgn.json'],
  ['../gross-national-debt', 'euro.json'],
  ['../gross-national-debt', 'gdp.json'],
  ['../gross-external-debt', 'euro.json'],
  ['../government-deficit-and-surplus', 'bgn.json'],
  ['../government-deficit-and-surplus', 'gdp.json'],
  ['../gini-coefficient', 'gini-coefficient.json'],
  ['../hicp', 'HICP.json'],
];

let compiledFiles = [];

files.forEach((file) => {
  normalizeFile(`./${file[0]}/raw/${file[1]}`, `./${file[0]}/${file[1]}`);
  compiledFiles.push(`./${file[0]}/${file[1]}`);
});

const fs = require('fs').promises;

async function combineJsonFiles(filePaths) {
  const combinedData = [];

  for (const filePath of filePaths) {
    console.log(filePath);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
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

combineJsonFiles(compiledFiles).then((combinedData) => {
  fs.writeFile('../charts.json', JSON.stringify(combinedData, null, 2) + '\n', (err) => {
    if (err) {
      console.error('Error writing file:', err);
    } else {
      console.log('File written successfully!');
    }
  }).then();
});
