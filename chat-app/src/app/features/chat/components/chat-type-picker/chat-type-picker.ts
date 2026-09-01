import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type ChatTab = 'groups' | 'direct';

@Component({
  selector: 'app-chat-type-picker',
  imports: [MatIconModule],
  templateUrl: './chat-type-picker.html',
  styleUrl: './chat-type-picker.scss',
})
export class ChatTypePicker {
  readonly activeTab = input<ChatTab>('groups');
  readonly tabChange = output<ChatTab>();
}