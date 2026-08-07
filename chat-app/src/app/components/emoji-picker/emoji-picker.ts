import { Component, ElementRef, inject, input, output } from '@angular/core';

@Component({
  selector: 'app-emoji-picker',
  templateUrl: './emoji-picker.html',
  styleUrl: './emoji-picker.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close.emit()',
  },
})
export class EmojiPicker {
  private el = inject(ElementRef<HTMLElement>);

  readonly flat = input(false);
  readonly emojiSelect = output<string>();
  readonly close = output<void>();

  readonly emojis = [
    '😀', '😂', '😊', '😍', '😎', '🤔', '😉', '😢',
    '😡', '😱', '👍', '👎', '👏', '🙏', '💪', '🤝',
    '❤️', '🔥', '🎉', '✨', '👀', '💯', '🚀', '✅',
  ];

  onDocumentClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.close.emit();
    }
  }
}