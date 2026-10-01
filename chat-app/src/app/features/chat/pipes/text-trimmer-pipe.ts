import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'textTrimmer',
})
export class TextTrimmerPipe implements PipeTransform {
  transform(value: string): string {
    if (value.length > 22) {
      return value.substring(0, 19) + '...'
    }
    return value;
  }
}
