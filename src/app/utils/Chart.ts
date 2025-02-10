import moment from 'moment';

export function bigTimeChart(series: any, yAxisGantt: any, legend: { data: string[]; map: any; selected: {} }) {
  const fromYear = 1995;
  const toYear = new Date().getFullYear();
  const years = [];
  const min = `${fromYear}-01-01`;
  const max = moment().format('YYYY-MM-DD');

  for (let year = fromYear; year <= toYear; year++) {
    years.push(year.toString());
  }

  return {
    tooltip: {
      axisPointer: {
        type: 'cross',
      },
      textStyle: {
        fontSize: 16,
      },
    },
    grid: [
      {
        top: '0%',
        bottom: '70%',
        right: '21%',
        left: '18%',
      },
      {
        top: '31%',
        bottom: '5%',
        right: '21%',
        left: '18%',
      },
    ],
    legend: {
      inactiveColor: '#999',
      type: 'scroll',
      orient: 'vertical',
      left: '80%',
      data: legend.data,
      formatter: function (name: any) {
        let text = legend.map[name] || name;
        if (text.length > 50) {
          return text.slice(0, 50) + '...';
        }
        return text;
      },
      selected: legend.selected,
    },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: [0, 1],
        filterMode: 'weakFilter',
      },
    ],
    xAxis: [
      {
        show: true,
        type: 'time',
        splitLine: {
          show: true,
        },
        axisTick: {
          show: false,
          alignWithLabel: false,
          customValues: years,
        },
        axisLabel: {
          show: false,
          interval: 0,
          customValues: years,
        },
        gridIndex: 0,
        min: min,
        max: max,
      },
      {
        show: true,
        type: 'time',
        splitLine: {
          show: true,
        },
        axisTick: {
          show: false,
          alignWithLabel: false,
          customValues: years,
        },
        gridIndex: 1,
        min: min,
        max: max,
        axisLabel: {
          show: true,
          interval: 0,
          customValues: years,
        },
      },
      {
        show: true,
        gridIndex: 1,
      },
    ],
    yAxis: [
      {
        gridIndex: 0,
        data: yAxisGantt,
        inverse: true,
        axisTick: { show: false },
        axisLine: { show: false },
        splitLine: { show: true },
        axisLabel: {
          fontSize: 13,
        },
      },
      {
        gridIndex: 1,
        position: 'left',
        offset: 0,
        nameLocation: 'middle',
        nameGap: 0,
        nameTextStyle: {
          backgroundColor: 'rgba(0,0,0, 0.3)',
          color: '#FFF',
          padding: [2, 5, 2, 5],
        },
        axisLine: {
          show: true,
          lineStyle: {
            width: 2,
            type: 'solid',
          },
        },
      },
      {
        gridIndex: 1,
        position: 'left',
        offset: 60,
        nameLocation: 'middle',
        nameGap: 0,
        nameTextStyle: {
          backgroundColor: 'rgba(0,0,0, 0.3)',
          color: '#FFF',
          padding: [2, 5, 2, 5],
        },
        axisLine: {
          show: true,
          lineStyle: {
            width: 2,
            type: 'solid',
          },
        },
      },
    ],
    animation: false,
    series: series,
    textStyle: {
      fontFamily: 'Sofia Sans',
      fontSize: 14,
    },
  };
}
