import { Pipe, PipeTransform } from '@angular/core';
import { toHumanDate } from './utils/Utils';

@Pipe({
  name: 'humanDate',
})
export class HumanDatePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';

    return toHumanDate(value);
  }
}
