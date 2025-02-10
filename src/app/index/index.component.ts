import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { BarChart, CustomChart, LineChart } from 'echarts/charts';
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  ToolboxComponent,
  TooltipComponent,
} from 'echarts/components';
import { ECharts } from 'echarts';
import { DataService } from '../data.service';
import { forkJoin } from 'rxjs';
import { saveAsImage, convertMoneyCharts, combineSeries, legendAllUnSelect, toggleLegends, switchLegends } from '../utils/ChartUtils';
import { CommonModule } from '@angular/common';
import { CanvasRenderer } from 'echarts/renderers';
import { FormsModule } from '@angular/forms';
import { NgbCollapse, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { humanDateDiff, loadData, buildPayload, humanValue } from '../utils/Utils';
import { HumanDatePipe } from '../human-date.pipe';
echarts.use([
  BarChart,
  GridComponent,
  CanvasRenderer,
  LegendComponent,
  LineChart,
  CustomChart,
  ToolboxComponent,
  DataZoomComponent,
  TooltipComponent,
  MarkAreaComponent,
  MarkLineComponent,
]);
import { marked } from 'marked';
import { IconsModule } from '../icons.module';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { bigTimeChart } from '../utils/Chart';

@Component({
  selector: 'app-index',
  imports: [CommonModule, NgxEchartsDirective, FormsModule, NgbTooltip, HumanDatePipe, IconsModule, NgbCollapse, RouterLink],
  templateUrl: './index.component.html',
  styleUrl: './index.component.scss',
  providers: [provideEchartsCore({ echarts })],
})
export class IndexComponent implements OnInit {
  @ViewChild('collapse', { static: false }) collapse!: NgbCollapse;

  public convert: { currency: string; magnitude: string } = { currency: 'EUR', magnitude: '1000000000' };
  public realityCheck: { [key: string]: boolean } = {};
  public switches: { [key: string]: boolean } = {};
  public chart!: any;
  public knowledgeItems: any;
  public moneyCharts: string[] = [];
  public chartInstance!: ECharts;
  public isRealityCheckPanelCollapsed = true;
  public content: any = {};
  public data = {
    timeline: [],
    verticalLine: [],
    horizontalLine: [],
    area: [],
    charts: [],
    wordsAndData: [],
    knowledge: [{ content: '', title: '' }],
    settings: { style: {} },
  };

  protected readonly humanDateDiff = humanDateDiff;
  protected readonly legendAllUnSelect = legendAllUnSelect;
  protected readonly humanValue = humanValue;
  protected readonly saveAsImage = saveAsImage;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private dataService: DataService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    forkJoin([
      this.dataService.getData('timeline-gantt.json'),
      this.dataService.getData('timeline-line.json'),
      this.dataService.getData('value-line.json'),
      this.dataService.getData('timeline-area.json'),
      this.dataService.getData('charts.json'),
      this.dataService.getData('words-and-data.json'),
      this.dataService.getData('knowledge.json'),
      this.dataService.getData('settings.json'),
    ]).subscribe({
      next: ([timeline, verticalLine, horizontalLine, area, charts, wordsAndData, knowledge, settings]) => {
        this.data.timeline = timeline;
        this.data.verticalLine = verticalLine;
        this.data.horizontalLine = horizontalLine;
        this.data.area = area;
        this.data.charts = charts;
        this.data.wordsAndData = wordsAndData;
        this.data.knowledge = knowledge;
        this.data.settings = settings;

        const load = loadData(this.activatedRoute.snapshot.queryParamMap.get('story'), settings.default);

        this.convert.currency = load.currency;
        this.convert.magnitude = load.magnitude;
        this.switches = load.switches;
        this.isRealityCheckPanelCollapsed = load.realityCheck.length === 0;

        load.realityCheck.forEach((key: any) => {
          this.realityCheck[key] = true;
        });

        // Prioritise defaults
        if (settings.default.series.includes('covid')) {
          load.legends.push('covid');
          this.switches['covid'] = settings.default.series.includes('covid');
        }

        if (settings.default.series.includes('war-russia-ukraine')) {
          load.legends.push('war-russia-ukraine');
          this.switches['war-russia-ukraine'] = settings.default.series.includes('war-russia-ukraine');
        }

        [...charts, ...wordsAndData].forEach((chart: any) => {
          if (['BGN', 'EUR'].includes(chart.unit)) {
            this.moneyCharts.push(chart.id);
          }
        });

        this.loadChart(area, timeline, charts, load.legends, wordsAndData);

        this.cdr.detectChanges();
      },
      error: () => {},
      complete: () => {},
    });
  }

  toMarkdown(text: string) {
    return marked.parse(text).toString();
  }

  loadChart(area: any, gantt: any, charts: any, defaultLegends: string[], charts2: any): void {
    let legend: any = { data: [], map: {}, selected: {} };

    area.forEach((item: any) => {
      legend.selected[item.id] = defaultLegends.includes(item.id);
    });

    this.data.verticalLine.forEach((item: any) => {
      legend.selected[item.id] = defaultLegends.includes(item.id);
    });

    charts.forEach((item: any) => {
      legend.map[item.id] = item.shortName ?? item.name;
      legend.selected[item.id] = defaultLegends.includes(item.id);

      if (!item.id.endsWith('-country') || item.id.endsWith('bg-country')) {
        legend.data.push(item.id);
      }

      if (item.id.endsWith('-country') || item.id.endsWith('bg-country')) {
        legend.selected[item.id] = defaultLegends.includes(item.id);
      }
    });

    charts2.forEach((item: any) => {
      legend.selected[item.id] = false;
    });

    this.chart = bigTimeChart(
      combineSeries(area, gantt, [...charts, ...charts2], this.data.verticalLine, this.data.horizontalLine),
      gantt.map((group: any) => group.name),
      legend
    );
  }

  onChartInit(chart: any): void {
    this.chartInstance = chart;

    // Use a little bit of timeout to ensure the chart is initialised
    setTimeout(() => {
      this.toggleLabels(false);
      this.toggleNeighbors(false);

      const series = this.chartInstance.getOption()['series'];

      this.chartInstance.setOption({
        series: convertMoneyCharts(series, this.moneyCharts, this.convert.currency, this.convert.magnitude),
      });

      Object.keys(this.realityCheck).forEach((key) => {
        this.talk(key);
      });
    }, 10);
  }

  onToggleGroupDeficitAndSurplus(): void {
    legendAllUnSelect(this.chartInstance);
    toggleLegends(['government-deficit-and-surplus-bgn', 'government-deficit-and-surplus-gdp', 'gdp-bgn'], 'legendSelect', this.chartInstance);
    this.switchDebtEvents(false);
  }

  onToggleGroupDebt(): void {
    legendAllUnSelect(this.chartInstance);
    toggleLegends(['gross-national-debt-euro', 'gross-national-debt-gdp', 'gross-external-debt', 'gdp-bgn'], 'legendSelect', this.chartInstance);
    this.switchDebtEvents(true);
  }

  onChangePreset() {
    switchLegends(['covid'], this.switches['covid'], this.chartInstance);
    switchLegends(['war-russia-ukraine'], this.switches['war-russia-ukraine'], this.chartInstance);
    switchLegends(['debt-events'], this.switches['debt-events'], this.chartInstance);
    switchLegends(['other-events'], this.switches['other-events'], this.chartInstance);
    switchLegends(['parliament-elections'], this.switches['parliament-elections'], this.chartInstance);
    this.switchDebtEvents(this.switches['debt-events']);

    this.save();
  }

  switchDebtEvents(state: boolean) {
    switchLegends(['debt-events'], state, this.chartInstance);
    this.switches['debtEvents'] = state;
  }

  convertChart() {
    this.chartInstance.setOption({
      series: convertMoneyCharts(
        combineSeries(this.data.area, this.data.timeline, [...this.data.charts, ...this.data.wordsAndData], this.data.verticalLine, this.data.horizontalLine),
        this.moneyCharts,
        this.convert.currency,
        this.convert.magnitude
      ),
    });

    this.toggleLabels();

    this.save();
  }

  toggleLabels(save: boolean = true): void {
    const options: any = this.chartInstance.getOption();
    const charts = options.series.filter((item: any) => item.type === 'line');

    charts.forEach((item: any) => {
      item.label.show = this.switches['labels'];
    });

    this.chartInstance.setOption(options);

    if (save) {
      this.save();
    }
  }

  toggleNeighbors(save: boolean = true): void {
    const options: any = this.chartInstance.getOption();
    const countryBg = options.series.filter((item: any) => item?.name?.endsWith('bg-country')).map((item: any) => item.name);
    const countries = options.series.filter((item: any) => item?.name?.endsWith('-country')).map((item: any) => item.name);
    const cw = countries.filter((item: any) => !countryBg.includes(item));

    if (this.switches['neighbors']) {
      this.chartInstance.setOption({
        legend: {
          data: options.legend[0].data.filter((item: any) => !countries.includes(item)),
          selected: {
            ...options.legend[0].selected,
            ...Object.fromEntries(countries.map((key: any) => [key, false])),
          },
        },
      });

      let options2: any = this.chartInstance.getOption();
      this.chartInstance.setOption({
        legend: {
          data: [...options2.legend[0].data, ...countries],
          selected: {
            ...Object.fromEntries(countries.map((key: any) => [key, false])),
            ...options.legend[0].selected,
          },
        },
      });
    } else {
      this.chartInstance.setOption({
        legend: {
          data: options.legend[0].data.filter((item: any) => !cw.includes(item)),
          selected: {
            ...options.legend[0].selected,
            ...Object.fromEntries(cw.map((key: any) => [key, false])),
          },
        },
      });
    }

    if (save) {
      this.save();
    }
  }

  talk(id: string): void {
    const item: any = this.data.wordsAndData.find((value: any) => value.id === id);

    if (!item) {
      return;
    }

    switchLegends([id], this.realityCheck[id], this.chartInstance);
    switchLegends(item.meta.relatedCharts, true, this.chartInstance);

    this.switches['labels'] = true;
    this.toggleLabels();

    this.save();
  }

  onChartClick(event: any): void {
    const knowledgeId = event.data.content?.knowledgeId;

    if (knowledgeId) {
      this.knowledgeItems = this.data.knowledge.filter((item: any) => item.group?.includes(knowledgeId));
    } else {
      this.knowledgeItems = null;
    }

    const sources = event.data.content.sources;

    if (sources) {
      if (event.data.content?.sources) {
        event.data.content.sources.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }

      this.content = event.data.content;

      return;
    }

    let content: any = this.data.charts.find((item: any) => item.id === event.seriesName);

    if (content) {
      this.content = { ...event.data.content, ...{ sources: content.sources, name: content.name } };

      return;
    }

    let wordsAndData = this.data.wordsAndData.find((item: any) => item.id === event.seriesName);

    if (wordsAndData) {
      this.content = wordsAndData;
    }
  }

  save(): void {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {
        story: buildPayload(this.chartInstance.getOption(), this.realityCheck, this.switches, this.convert),
      },
    });
  }

  toggleRealityCheck(): void {
    this.collapse.toggle();

    if (this.isRealityCheckPanelCollapsed) {
      Object.keys(this.realityCheck).forEach((key) => {
        this.talk(key);
      });
    }

    this.save();
  }
}
