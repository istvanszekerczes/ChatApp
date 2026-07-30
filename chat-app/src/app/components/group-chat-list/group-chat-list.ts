import { Component, inject, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ChatService } from '../../services/chat';
import { InitialPipe } from '../../pipes/initial-pipe';
import { Chat, ChatType } from '../../models/chat';


@Component({
  selector: 'app-group-chat-list',
  imports: [MatIconModule, InitialPipe],
  templateUrl: './group-chat-list.html',
  styleUrl: './group-chat-list.scss',
})
export class GroupChatList {
  private chatService = inject(ChatService);

  chats = signal<Chat[]>([]);
  activeFilter = signal<ChatType | null>(null);
  loading = signal(false);

  visibleChats = computed(() => {
    const filter = this.activeFilter();
    const all = this.chats();
    return filter ? all.filter(c => c.type === filter) : all;
  });

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.chatService.getChats().subscribe({
      next: chats => {
        this.chats.set(chats);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleFilter(type: ChatType) {
    this.activeFilter.set(this.activeFilter() === type ? null : type);
  }
}
