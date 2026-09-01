import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'initial',
})

/**
 * A pipe that transforms a string value into its initial character, capitalized.
 */
export class InitialPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return value?.trim().charAt(0).toUpperCase() ?? '';
  }
}