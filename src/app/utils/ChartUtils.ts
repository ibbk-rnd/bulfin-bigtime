import * as echarts from 'echarts/core';
import { ECharts } from 'echarts';
import moment from 'moment';
import { humanDateDiff, humanValue, toHumanDate } from './Utils';
import Decimal from 'decimal.js';

export function toggleLegends(legends: string[], event: string, chartInstance: ECharts) {
  legends.forEach((legend) => {
    chartInstance.dispatchAction({
      type: event,
      name: legend,
    });
  });
}

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

export function convertCurrency(value: number, from: string, to: string) {
  // https://www.bnb.bg/statistics/stexternalsector/stexchangerates/sterfixed/index.htm
  const eurToBgn = 1.95583;
  const bgnToEur = 0.511292;

  if (from === 'BGN' && to === 'EUR') {
    return new Decimal(value).mul(bgnToEur).toNumber();
  } else if (from === 'EUR' && to === 'EUR') {
    return new Decimal(value).mul(eurToBgn).toNumber();
  }

  return value;
}

export function convertMoneyCharts(series: any, moneyCharts: any, currency: any, magnitude: any) {
  series.forEach((series: any) => {
    if (moneyCharts.includes(series.name)) {
      series.data = series.data.map((item: any) => {
        const change = convertCurrency(item.content?.change ?? 0, item.content.unit, currency);
        const value = convertCurrency(item.value[1], item.content.unit, currency);

        return {
          content: {
            ...item.content,
            ...{
              change: change,
              unit: currency,
              value: value,
            },
          },
          value: [item.value[0], value],
        };
      });

      series.data = series.data.map((item: any) => {
        const value = new Decimal(item.value[1]).dividedBy(parseInt(magnitude)).toNumber();

        return {
          content: {
            ...item.content,
            ...{
              change: new Decimal(item.content.change).dividedBy(parseInt(magnitude)).toNumber(),
              magnitude: parseInt(magnitude),
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

export function markArea(areas: any, showLabels: boolean, axisIndex = 0, style: any) {
  const data: any = [];

  areas.items.forEach((item: any) => {
    const to = item.value[1] === null ? +new Date() : +new Date(item.value[1]);

    data.push([
      {
        ...{
          content: {
            type: 'gantt',
            name: item.name,
            comment: item?.comment,
            description: item?.description,
            sources: item.sources,
            period: [item.value[0], item.value[1]],
            from: item.value[0],
            to: to,
          },
          name: item.name,
          description: item.description,
          xAxis: item.value[0],
        },
        ...style,
      },
      {
        xAxis: to,
      },
    ]);
  });

  const result: any = {
    type: 'line',
    name: areas.id,
    emphasis: {
      focus: 'series',
    },
    markArea: {
      label: {
        show: showLabels,
        position: 'inside',
        rotate: 90,
        color: '#333',
      },
      tooltip: {
        formatter: ganttLabel,
      },
      data: data,
      emphasis: {
        disabled: true,
      },
    },
    xAxisIndex: axisIndex,
    yAxisIndex: axisIndex,
  };

  return result;
}

export function combineSeries(area: any, gantt: any, charts: any, verticalLine: any, horizontalLine: any) {
  const series: any = [];
  series.push(currentDateLine());
  series.push(currentDateLine(1));

  area.forEach((item: any) => {
    series.push(markArea(item, false, 0, item.meta?.style));
    series.push(markArea(item, true, 1, item.meta?.style));
  });

  verticalLine.forEach((item: any) => {
    series.push(markLine(item.items, false, 0, 0, item.id, item.meta?.style, item.name));
    series.push(markLine(item.items, false, 1, 1, item.id, item.meta?.style, item.name));
  });

  horizontalLine.forEach((item: any) => {
    series.push(markLine(item.items, false, item.meta.xAxisIndex, item.meta.yAxisIndex, item.id, item.meta?.style, item.text));
  });

  charts.forEach((chart: any) => {
    if (chart.unit === 'percent') {
      series.push(buildLine(chart, null, 1, 1));
    } else {
      series.push(buildLine(chart, null, 1, 2));
    }
  });

  series.push(buildGantt(gantt, 0));

  return series;
}

export function buildGantt(groups: any, index = 0) {
  const data: any[] = [];

  let i = 0;
  groups.forEach((group: any) => {
    group.items.forEach((item: any) => {
      const from = +new Date(item.value[0]);
      const to = item.value[1] === null ? +new Date() : +new Date(item.value[1]);

      data.push({
        content: {
          type: 'gantt',
          knowledgeId: group.knowledgeId,
          group: group.name,
          name: `${item.name} (${group.name})`,
          description: item?.description,
          comment: item?.comment,
          sources: item.sources,
          period: [item.value[0], to],
          from: item.value[0],
          to: to,
        },
        name: item.name,
        value: [i, from, to, item.label === undefined ? ' ' : item.label + '@'],
        itemStyle: {
          color: stringToHexColor(item.name),
        },
      });
    });

    i = i + 1;
  });

  return {
    type: 'custom',
    tooltip: {
      formatter: ganttLabel,
    },
    renderItem: function (params: any, api: any) {
      const categoryIndex = api.value(0);
      const start = api.coord([api.value(1), categoryIndex]);
      const end = api.coord([api.value(2), categoryIndex]);
      const height = api.size([0, 1])[1] * 0.7;
      const label = api.value(3).replace('@', '');
      const labelWidth = echarts.format.getTextRect(label).width;
      const text = end[0] - start[0] > labelWidth + 10 && start[0] + end[0] - start[0] >= 180 ? label : '';

      const rectShape = echarts.graphic.clipRectByRect(
        {
          x: start[0],
          y: start[1] - height / 2,
          width: end[0] - start[0],
          height: height,
        },
        {
          x: params.coordSys.x,
          y: params.coordSys.y,
          width: params.coordSys.width,
          height: params.coordSys.height,
        }
      );
      const rectText = echarts.graphic.clipRectByRect(
        {
          x: start[0],
          y: start[1] - height / 2,
          width: end[0] - start[0],
          height: height,
        },
        {
          x: params.coordSys.x,
          y: params.coordSys.y,
          width: params.coordSys.width,
          height: params.coordSys.height,
        }
      );
      return (
        rectShape && {
          type: 'group',
          children: [
            {
              type: 'rect',
              transition: ['shape'],
              shape: rectShape,
              style: {
                ...api.style(),
                stroke: 'black',
                lineWidth: 1,
                opacity: 0.8,
              },
              emphasis: {
                style: {
                  opacity: 1,
                },
              },
            },
            {
              type: 'rect',
              ignore: !rectText,
              shape: rectText,
              style: api.style({
                text: text,
                textFill: '#FFF',
              }),
            },
          ],
        }
      );
    },
    itemStyle: {
      opacity: 0.8,
    },
    encode: {
      x: [1, 2],
      y: 0,
    },
    data: data,
    xAxisIndex: index,
    yAxisIndex: index,
  };
}

export function saveAsImage(chartInstance: ECharts): void {
  const dataURL = chartInstance.getDataURL({
    pixelRatio: 1,
    backgroundColor: '#fff',
  });

  const link = document.createElement('a');
  link.href = dataURL;
  link.download = `bulgaria-fin-charts-${moment().format('YYYY-MM-DD')}.png`;
  link.click();
}

function stringToHexColor(str: any) {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const r = (hash & 0xff0000) >> 16;
  const g = (hash & 0x00ff00) >> 8;
  const b = hash & 0x0000ff;

  const distinctR = (r + 128) % 256;
  const distinctG = (g + 128) % 256;
  const distinctB = (b + 128) % 256;

  return `#${((1 << 24) + (distinctR << 16) + (distinctG << 8) + distinctB).toString(16).slice(1)}`;
}

function currentDateLine(axisIndex = 0) {
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const today = 'днес, ' + moment().format('D MMMM');

  const result: any = {
    type: 'line',
    data: [[currentDate.getTime()]],
    markLine: {
      data: [
        {
          xAxis: currentDate.getTime(),
          lineStyle: {
            color: 'red',
            type: 'solid',
            width: 2,
          },
          label: {
            show: false,
          },
        },
      ],
      tooltip: {
        formatter: today,
      },
      silent: false,
      animation: false,
      symbol: 'none',
    },
    xAxisIndex: axisIndex,
    yAxisIndex: axisIndex,
  };

  return result;
}

function toNow(from: string, to: string): string {
  const diffStartToNow = humanDateDiff(from, new Date().getTime());
  const diffEndToNow = humanDateDiff(to, new Date().getTime());

  if (diffEndToNow.length > 0) {
    return `<div class="mt-1">${diffStartToNow} от началото до днес</div><div class="mt-1">${diffEndToNow} от края до днес</div>`;
  }

  return '';
}

function buildLine(chart: any, style: any = null, xAxisIndex: number, yAxisIndex: number) {
  const result: any = {
    ...{
      name: chart.id,
      type: 'line',
      tooltip: {
        formatter: (params: any) => {
          const x = toHumanDate(params.data.value[0]);

          let change = '';

          if (params.data.content.change) {
            change =
              params.data.content.change > 0 ? '+' + params.data.content.change.toLocaleString('en-US') : params.data.content.change.toLocaleString('en-US');
          }

          const changePercent = params.data.content.changePercent > 0 ? '+' + params.data.content.changePercent : params.data.content.changePercent;

          let value = humanValue(params.data.value[1], params.data.content.unit, params.data.content?.magnitude);
          let suffix = humanValue(params.data.value[1], params.data.content.unit, params.data.content?.magnitude, true);
          let changeHtml = `<div class="fw-bold me-2 pe-2"> ${value}</div>`;

          if (change) {
            changeHtml = `<div class="fw-bold me-2 pe-2 border-end border-1 border-secondary"> ${value}</div><div class=" d-flex">
                  <div class="me-2">промяна <strong>${change}${suffix}</strong></div>
                  <div class="fw-bold">${changePercent}%</div>
              </div>`;
          }

          return `
            <div style="max-width: 600px;white-space: wrap;">
              <div class="d-flex justify-content-between">
                <div class="fw-bold me-3">${params.marker} ${chart.name}</div>
                <div class="fw-bold text-nowrap">${x}</div>
              </div>
              <div class="d-flex">${changeHtml}</div>
            </div>`;
        },
      },
      emphasis: {
        focus: 'series',
        label: {
          show: true,
        },
      },
      data: [],
      xAxisIndex: xAxisIndex,
      yAxisIndex: yAxisIndex,
      label: {
        show: false,
        position: 'top',
        formatter: (params: any) => {
          return params.data.value[1].toFixed(1).toLocaleString('en-US');
        },
      },
    },
    ...style,
    ...chart?.meta?.style,
  };

  chart.data.forEach((item: any) => {
    result.data.push({
      content: {
        knowledgeId: chart.knowledgeId,
        unit: chart.unit,
        magnitude: chart.magnitude ?? 1,
        change: item?.change,
        changePercent: item?.changePercent,
        date: item.date,
        value: item.value,
      },
      value: [item.date, item.value],
    });
  });

  return result;
}

function markLine(items: any, showLabels: boolean, xAxisIndex = 0, yAxisIndex = 0, seriesName: string, style: any, text = '') {
  const data: any = [];

  items.forEach((item: any) => {
    let axis: any = {};

    if (item.date) {
      axis.xAxis = item.date;
    }

    if (item.value) {
      axis.yAxis = item.value;
    }

    data.push({
      ...{
        name: item?.name,
        label: {
          show: showLabels,
          position: 'start',
          formatter: item?.name ?? '',
        },
        content: {
          name: item.name ?? seriesName,
          sources: item.sources,
          description: item.description,
          date: item.date,
        },
      },
      ...style,
      ...axis,
      ...item?.meta?.style,
    });
  });

  return markLineSeries(text, data, style, seriesName, xAxisIndex, yAxisIndex);
}

function markLineSeries(text: string, data: [], style: any, seriesName: string, xAxisIndex: number, yAxisIndex: number) {
  const seriesColor = style?.[seriesName]?.lineStyle.color;

  return {
    type: 'line',
    name: seriesName,
    data: [],
    visible: false,
    markLine: {
      data: data,
      visible: false,
      tooltip: {
        formatter: function (params: any) {
          let result = '';

          if (params.data.xAxis) {
            let date = toHumanDate(params.data.value);
            const color = seriesColor ? seriesColor : params.data?.lineStyle?.color ? params.data?.lineStyle?.color : '#000';

            let diffText = '';

            if (params.data.name || text) {
              result += `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>`;
              result += text.length > 0 ? text.replace('{name}', params.data.name) : params.data.name;
            } else {
              result += seriesName;
            }

            if (new Date(params.data.value) < new Date()) {
              diffText = `<br>${humanDateDiff(params.data.value, new Date().getTime())} до днес`;
            } else {
              date = 'около ' + date;
              diffText = `<br>след около ${humanDateDiff(new Date().getTime(), params.data.value)}`;
            }

            result += `<br><b>${date}</b>${diffText}`;
          } else {
            const color = seriesColor ? seriesColor : params.data?.lineStyle?.color ? params.data?.lineStyle?.color : '#000';
            const value = params.data.value;

            result += text.length > 0 ? text.replace('{name}', params.data.name) : params.data.name;
            result += `<br><span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span><b>${value}%</b>`;
          }

          return result;
        },
      },
      silent: false,
      animation: false,
      symbol: 'none',
      emphasis: {
        disabled: true,
      },
    },
    xAxisIndex: xAxisIndex,
    yAxisIndex: yAxisIndex,
    color: seriesColor,
  };
}

function ganttLabel(params: any) {
  if (params.data.content?.type === 'gantt') {
    const from = toHumanDate(params.data.content.from);
    const diff = humanDateDiff(params.data.content.from, params.data.content.to);
    const name = params.name;
    let fill = '#000';
    let to = params.data.content.to ? `- ${toHumanDate(params.data.content.to)} (${diff})` : `до днес (${diff})`;
    let description = '';

    if (params.data.itemStyle?.color) {
      fill = params.data.itemStyle?.color;
    } else if (params.color) {
      fill = params.color;
    }

    if (params.data.content.description) {
      description = '<br>' + params.data.content.description;
    }

    let text = `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${fill};"></span> ${name}${description}`;

    if (params.data.content.comment) {
      text += ` (${params.data.content.comment})`;
    }

    text += `<br><b>${from} ${to}</b>`;
    text += toNow(params.data.content.from, params.data.content.to);

    return text;
  }

  if (params?.data?.description !== undefined) {
    return '<div style="width: 300px; white-space: wrap;">' + params.data.description + '<div class="mt-1">${diffToNow} до днес</div></div>';
  }

  if (params.value === undefined) {
    return '';
  }

  const date = toHumanDate(params.data.value[0]);
  const value = params.value[1].toLocaleString('en-US');
  const diffToNow = humanDateDiff(params.data.value[0], new Date().getTime());

  let result = `${params.marker} ${params.seriesName}`;

  if (params.data.content.name && params.data.content.name !== params.seriesName) {
    result += ` (${params.data.content.name})`;
  }

  let diffText = '';

  if (params.data.content?.diff && params.data.content.diff !== params.value[1]) {
    diffText = '(' + (params.data.content.diff > 0 ? '+' : '') + params.data.content.diff.toLocaleString('en-US') + ')';
  }

  result += ` - <b>${date}</b><br><b>${value} ${diffText}</b><div class="mt-1">${diffToNow} до днес</div>`;

  return result;
}
