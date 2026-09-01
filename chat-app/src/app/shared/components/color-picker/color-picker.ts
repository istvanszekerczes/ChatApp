import { Component, ElementRef, inject, input, output } from '@angular/core';

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.html',
  styleUrl: './color-picker.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close.emit()',
  },
})
export class ColorPicker {
  private el = inject(ElementRef<HTMLElement>);

  readonly selected = input<string | null>(null);
  readonly flat = input(false);
  readonly colorChange = output<string>();
  readonly close = output<void>();

  readonly colors = [
    '#3b82f6', '#ef4444', '#22c55e', '#a855f7', '#f59e0b', '#ec4899',
  ];

  onDocumentClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.close.emit();
    }
  }
}