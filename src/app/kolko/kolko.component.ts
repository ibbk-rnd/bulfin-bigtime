import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ForYear, FromYearEnd, FromYearStart, PerDayPipe, PerMonthPipe } from '../per-day.pipe';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { DataService } from '../services/data.service';
import {JsonPipe, NgIf} from '@angular/common';

@Component({
  selector: 'app-kolko',
  imports: [RouterLink, PerDayPipe, PerMonthPipe, ReactiveFormsModule, ForYear, NgIf, JsonPipe],
  templateUrl: './kolko.component.html',
})
export class KolkoComponent implements OnInit {
  public magnitude = 1000000;
  public currency = 'BGN';
  public aa: any = [];

  constructor(private dataService: DataService) {}

  form = new FormGroup({
    magnitude: new FormControl('1000000'),
    currency: new FormControl('BGN'),
  });

  ngOnInit(): void {
    forkJoin([this.dataService.getData('charts.json')]).subscribe({
      next: ([charts]) => {
        let d = [
          { name: 'на МВР', chart: 'budget-mvr' },
          { name: 'от които за персонал', chart: 'budget-mvr' },
          { name: 'на Националната здравноосигорителна каса', chart: 'budget-nzok' },
          { name: 'на Националната здравноосигорителна каса', chart: 'budget-ban' },
          { name: 'Съдебна власт', chart: 'budget-judiciary' },
          { name: 'Прокуратура', chart: 'budget-prosecutor' },
          { name: 'МОН', chart: 'budget-mon' },
        ];

        d.forEach((a) => {
          this.aa.push({
            ...this.findLastItem(charts, a.chart),
            name: a.name,
            isVisible: false
          });
        });
      },
      error: () => {},
      complete: () => {},
    });

    this.form.valueChanges.subscribe((data) => {
      this.magnitude = parseInt(<string>data.magnitude);
      this.currency = <string>data.currency;
    });
  }

  public toggleInfo(item: any) {
    item.isVisible = !item.isVisible;
  }

  private findLastItem(charts: any, target: string) {
    let chart: any = charts.find((item: any) => {
      return item.id === target;
    });

    const lastItem = chart.data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    return {
      value: lastItem.value,
      sources: lastItem.sources,
    };
  }
}
