import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'textTrimmer',
})
export class TextTrimmerPipe implements PipeTransform {
  transform(value: string, name: string): string {
    const space = 21 - name.length;
    if (value.length + name.length < 22) {
      return value;
    }
    return value.substring(0, space) + '...'
  }
}
