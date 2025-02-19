import moment from 'moment/moment';

export function toHumanDate(date?: string | number) {
  return moment(date).format('D MMMM YYYY');
}

export function humanDateDiff(from: string | number, to: string | number, inDays = false): string {
  const startTimestamp = from;
  let endTimestamp = to;

  if (endTimestamp === null) {
    endTimestamp = new Date().getTime();
  }

  const startDate = moment(startTimestamp);
  const endDate = moment(endTimestamp);

  if (inDays) {
    return endDate.diff(startDate, 'days') + ' дни';
  }

  const years = endDate.diff(startDate, 'years');
  startDate.add(years, 'years');

  const months = endDate.diff(startDate, 'months');
  startDate.add(months, 'months');

  const days = endDate.diff(startDate, 'days');

  const parts = [];

  if (years > 0) {
    parts.push(`${years} ${years !== 1 ? 'години' : 'година'}`);
  }
  if (months > 0) {
    parts.push(`${months} ${months !== 1 ? 'месеца' : 'месец'}`);
  }
  if (days > 0) {
    parts.push(`${days} ${days !== 1 ? 'дни' : 'ден'}`);
  }

  return parts.join(', ');
}

export function humanValue(value: number, unit?: string, magnitude?: number, onlySuffix = false): string {
  const magnitudes: any = {
    1000000000: 'млрд.',
    1000000: 'млн.',
    1000: 'хил.',
  };

  const units: any = {
    BGN: 'лева',
    EUR: 'евро',
    percent: '%',
  };

  let suffix = '';

  if (unit === 'percent') {
    suffix = '%';
  } else {
    if (magnitude) {
      suffix += ' ' + magnitudes[magnitude];
    }

    if (unit) {
      suffix += ' ' + units[unit];
    }
  }

  if (onlySuffix) {
    return suffix;
  }

  return value.toLocaleString('en-US') + ' ' + suffix;
}

export function buildPayload(options: any, realityCheck: any, switches: any, convert: any) {
  const selected = options.legend[0].selected;

  return encodeData({
    realityCheck: Object.keys(realityCheck).filter((key) => realityCheck[key]),
    legends: Object.keys(selected).filter((key) => selected[key] === true),
    switches: Object.keys(switches)
      .filter((key) => switches[key])
      .map((key) => key),
    currency: convert.currency,
    magnitude: convert.magnitude,
  });
}

export function loadData(input: any, defaults: { series: string[]; currency: string; magnitude: string; switches: any }) {
  let series = defaults.series;
  let currency = defaults.currency;
  let magnitude = defaults.magnitude;
  let switches = defaults.switches;
  let realityCheck = [];

  if (input) {
    const decoded = decodeData(input);

    if (decoded.legends) {
      series = decoded.legends;
    }

    if (decoded.switches) {
      decoded.switches.forEach((key: any) => {
        if (switches.hasOwnProperty(key)) {
          switches[key] = key;
        } else {
          switches[key] = true;
        }
      });
    }

    if (decoded.currency) {
      currency = decoded.currency;
    }

    if (decoded.magnitude) {
      magnitude = decoded.magnitude;
    }

    if (decoded.realityCheck) {
      realityCheck = decoded.realityCheck;
    }
  }

  return {
    legends: series,
    switches: switches,
    currency: currency,
    magnitude: magnitude,
    realityCheck: realityCheck,
  };
}

function decodeData(data: any): any {
  return JSON.parse(fromBase64(data));
}

function encodeData(data: any): any {
  return toBase64(JSON.stringify(data));
}

function toBase64(str: string) {
  const bytes = new TextEncoder().encode(str);
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}
