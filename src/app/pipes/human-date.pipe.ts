import { Pipe, PipeTransform } from '@angular/core';
import { humanDate } from '../services/utils';

@Pipe({
  name: 'humanDate',
})
export class HumanDatePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';

    return humanDate(value);
  }
}
