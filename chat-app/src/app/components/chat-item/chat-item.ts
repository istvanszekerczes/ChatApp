import { Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { InitialPipe } from '../../pipes/initial-pipe';
import { Chat } from '../../models/chat';

@Component({
  selector: 'app-chat-item',
  imports: [MatIconModule, InitialPipe],
  templateUrl: './chat-item.html',
  styleUrl: './chat-item.scss',
})
export class ChatItem {
  readonly chat = input.required<Chat>();
  readonly active = input(false);
  readonly select = output<Chat>();

  readonly avatarColor = computed(() => this.chat().avatarColor || '#3b82f6');

  /** Member count is meaningless for public groups (everyone) and DMs (always 2). */
  readonly showCount = computed(() => {
    const type = this.chat().type;
    return type === 'PRIVATE_GROUP' || type === 'PROTECTED_GROUP';
  });

  /** Protected groups you haven't joined show a lock to signal the password prompt. */
  readonly showLock = computed(() =>
    this.chat().type === 'PROTECTED_GROUP' && !this.chat().isMember
  );
}