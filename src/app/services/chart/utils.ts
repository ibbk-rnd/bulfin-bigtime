import { ECharts } from 'echarts';
import moment from 'moment';
import { convertCurrency } from '../utils';
import Decimal from 'decimal.js';
import { buildGanttChart, buildLineChart, buildMarkArea, buildMarkLine, buildCurrentDateLine, buildMediaChart } from './series';

export function switchLegends(legends: string[], show: boolean, chartInstance: ECharts) {
  legends.forEach((legend) => {
    chartInstance.dispatchAction({
      type: show ? 'legendSelect' : 'legendUnSelect',
      name: legend,
    });
  });
}

export function legendAllUnSelect(chartInstance: ECharts) {
  chartInstance.dispatchAction({
    type: 'legendAllSelect',
  });

  chartInstance.dispatchAction({
    type: 'legendInverseSelect',
  });
}

export function convertMoneyCharts(series: any, moneyCharts: any, toCurrency: any, toMagnitude: any) {
  series.forEach((series: any) => {
    if (moneyCharts.includes(series.name)) {
      series.data = series.data.map((item: any) => {
        const change = convertCurrency(item.content?.change ?? 0, item.content.unit, toCurrency);
        const value = convertCurrency(item.value[1], item.content.unit, toCurrency);

        return {
          content: {
            ...item.content,
            ...{
              change: change,
              unit: toCurrency,
              value: value,
            },
          },
          value: [item.value[0], value],
        };
      });

      series.data = series.data.map((item: any) => {
        const value = new Decimal(item.value[1]).dividedBy(parseInt(toMagnitude)).toNumber();

        return {
          content: {
            ...item.content,
            ...{
              change: new Decimal(item.content.change).dividedBy(parseInt(toMagnitude)).toNumber(),
              magnitude: parseInt(toMagnitude),
              value: value,
            },
          },
          value: [item.value[0], value],
        };
      });
    }
  });

  return series;
}

export function buildSeries(area: any, gantt: any, charts: any, verticalLine: any, horizontalLine: any, media: any) {
  const series: any = [];
  series.push(buildCurrentDateLine());
  series.push(buildCurrentDateLine(1));

  area.forEach((item: any) => {
    series.push(buildMarkArea(item, false, 0, item.meta?.style));
    series.push(buildMarkArea(item, true, 1, item.meta?.style));
  });

  verticalLine.forEach((item: any) => {
    series.push(buildMarkLine(item.items, false, 0, 0, item.id, item.meta?.style, item.name));
    series.push(buildMarkLine(item.items, false, 1, 1, item.id, item.meta?.style, item.name));
  });

  horizontalLine.forEach((item: any) => {
    series.push(buildMarkLine(item.items, false, item.meta.xAxisIndex, item.meta.yAxisIndex, item.id, item.meta?.style, item.text));
  });

  charts.forEach((chart: any) => {
    if (chart.unit === 'percent') {
      series.push(buildLineChart(chart, null, 1, 1));
    } else {
      series.push(buildLineChart(chart, null, 1, 2));
    }
  });

  series.push(buildMediaChart(media));
  series.push(buildGanttChart(gantt, 0));

  return series;
}

export function saveAsImage(chartInstance: ECharts): void {
  const dataURL = chartInstance.getDataURL({
    pixelRatio: 1,
    backgroundColor: '#fff',
  });

  const link = document.createElement('a');
  link.href = dataURL;
  link.download = `bulfin-bigtime-${moment().format('YYYY-MM-DD')}.png`;
  link.click();
}
