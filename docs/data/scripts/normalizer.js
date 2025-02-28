const fs = require('fs');
const Decimal = require('decimal.js');
const moment = require('moment');

module.exports = {
  normalizeFile,
};

function normalizeFile(raw, output, commonSources) {
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
        result.push(normalize(item, commonSources));
      });
    } else {
      result = normalize(content, commonSources);
    }

    fs.writeFile(output, JSON.stringify(result, null, 2) + '\n', (err) => {
      if (err) {
        console.error('Error writing file:', err);
      }
    });
  });
}

function normalize(content, commonSources) {
  let magnitude;
  const result = { ...content };
  const data = [];
  let oldValue = null;
  let date = null;

  delete result.magnitude;

  const items = content.data.sort((a, b) => new Date(a.date) - new Date(b.date));

  items.forEach((item) => {
    magnitude = null;
    let value = item.value;

    if (item.magnitude) {
      magnitude = item.magnitude;
    } else if (content.magnitude) {
      magnitude = content.magnitude;
    }

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

    data.push({
      date: date,
      value: value,
      change: new Decimal(value).minus(new Decimal(oldValue)).toNumber(),
      changePercent: calculatePercentageDiff(oldValue, value),
      sources: item.sources ? mergeSources(item.sources, commonSources) : undefined,
    });

    oldValue = value;
  });

  result['data'] = data;

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

function mergeSources(itemSources, commonSources) {
  let common = [];
  let refs = [];

  itemSources.forEach((source) => {
    if (source.ref) {
      refs.push(source.ref);
      common.push(...commonSources.find((item) => item.id === source.ref).sources);
    }
  });

  const current = itemSources.filter((item) => !refs.includes(item['ref']));

  return [...current, ...common];
}
