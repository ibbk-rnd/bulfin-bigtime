const fs = require('fs');
const Decimal = require('decimal.js');
const moment = require('moment');

module.exports = {
  normalizeFile,
};

function normalizeFile(raw, output) {
  fs.readFile(raw, 'utf8', (err, fileContent) => {
    if (err) {
      console.error('Error reading the file:', err);
      return;
    }

    const content = JSON.parse(fileContent);

    let result;

    if (Array.isArray(content)) {
      result = [];
      content.forEach((item) => {
        result.push(normalize(item));
      });
    } else {
      result = normalize(content);
    }

    fs.writeFile(output, JSON.stringify(result, null, 2) + '\n', (err) => {
      if (err) {
        console.error('Error writing file:', err);
      } else {
        console.log('File written successfully!');
      }
    });
  });
}

function normalize(content) {
  const magnitude = content.magnitude;
  const result = { ...content };
  const data = [];
  let oldValue = null;
  let date = null;

  delete result.magnitude;

  content.data.forEach((item) => {
    let value = item.value;

    if (magnitude) {
      value = new Decimal(item.value).times(new Decimal(magnitude)).toNumber();
    }

    if (oldValue === null) {
      oldValue = value;
    }

    if (item.year) {
      if (item.month) {
        date = moment(`${item.year}-${item.month.toString().padStart(2, '0')}-01`)
          .endOf('month')
          .format('YYYY-MM-DD');
      } else {
        date = `${item.year}-12-31`;
      }
    }

    if (item.date) {
      date = item.date;
    }

    // changePercent = new Decimal(value).minus(new Decimal(oldValue)).dividedBy(new Decimal(oldValue).abs()).times(100).toDecimalPlaces(2).toNumber();

    data.push({
      date: date,
      value: value,
      change: new Decimal(value).minus(new Decimal(oldValue)).toNumber(),
      changePercent: calculatePercentageDiff(oldValue, value),
    });

    oldValue = value;
  });

  result.data = data;

  return result;
}

function calculatePercentageDiff(oldValue, newValue) {
  const oldDecimal = new Decimal(oldValue);
  const newDecimal = new Decimal(newValue);

  if (oldDecimal.isZero() && newDecimal.isZero()) {
    return new Decimal(0);
  }

  const difference = newDecimal.minus(oldDecimal);
  const averageValue = oldDecimal.abs().plus(newDecimal.abs()).dividedBy(2);

  return difference.dividedBy(averageValue).times(100).toDecimalPlaces(2).toNumber();
}
