import * as echarts from 'echarts/core';
import { humanDateDiff, humanValue, humanDate } from '../utils';
import moment from 'moment/moment';
import Decimal from 'decimal.js';

export function buildLineChart(chart: any, style: any = null, xAxisIndex: number, yAxisIndex: number) {
  const result: any = {
    ...{
      name: chart.id,
      type: 'line',
      tooltip: {
        formatter: (params: any) => {
          const x = humanDate(params.data.value[0]);

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
      symbolSize: 5,
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
          return new Decimal(params.data.value[1]).toDecimalPlaces(1).toNumber().toLocaleString('en-US');
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
        sources: item.sources,
      },
      value: [item.date, item.value],
    });
  });

  if (chart?.meta?.step) {
    result['step'] = chart.meta.step;
  }

  return result;
}

export function buildGanttChart(groups: any, index = 0) {
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
          color: stringToColor(item.name),
        },
      });
    });

    i = i + 1;
  });

  return {
    type: 'custom',
    tooltip: {
      formatter: timeRangeLabel,
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

export function buildMarkArea(areas: any, showLabels: boolean, axisIndex = 0, style: any) {
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
        formatter: timeRangeLabel,
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

export function buildMarkLine(items: any, showLabels: boolean, xAxisIndex = 0, yAxisIndex = 0, seriesName: string, style: any, text = '') {
  const data: any = [];
  const seriesColor = style?.[seriesName]?.lineStyle.color;

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
            let date = humanDate(params.data.value);
            const color = seriesColor ? seriesColor : params.data?.lineStyle?.color ? params.data?.lineStyle?.color : '#000';

            let diffText: string;

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

export function buildCurrentDateLine(axisIndex = 0) {
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

function timeRangeLabel(params: any) {
  if (params.data.content?.type === 'gantt') {
    const from = humanDate(params.data.content.from);
    const diff = humanDateDiff(params.data.content.from, params.data.content.to);
    const name = params.name;
    let fill = '#000';
    let to = params.data.content.to ? `- ${humanDate(params.data.content.to)} (${diff})` : `до днес (${diff})`;
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

  const date = humanDate(params.data.value[0]);
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

function stringToColor(str: string): string {
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

function toNow(from: string, to: string): string {
  const diffStartToNow = humanDateDiff(from, new Date().getTime());
  const diffEndToNow = humanDateDiff(to, new Date().getTime());

  if (diffEndToNow.length > 0) {
    return `<div class="mt-1">${diffStartToNow} от началото до днес</div><div class="mt-1">${diffEndToNow} от края до днес</div>`;
  }

  return '';
}
