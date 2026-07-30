import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'initial',
})
export class InitialPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return value?.trim().charAt(0).toUpperCase() ?? '';
  }
}