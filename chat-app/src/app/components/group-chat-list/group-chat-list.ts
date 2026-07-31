import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ChatService } from '../../services/chat';
import { InitialPipe } from '../../pipes/initial-pipe';
import { ChatType } from '../../models/chat';
import { Chat } from '../../models/chat';

@Component({
  selector: 'app-group-chat-list',
  imports: [MatIconModule, InitialPipe, FormsModule],
  templateUrl: './group-chat-list.html',
  styleUrl: './group-chat-list.scss',
})
export class GroupChatList {
  private chatService = inject(ChatService);

  readonly loading = this.chatService.loading;
  activeFilter = signal<ChatType | null>('PUBLIC_GROUP');
  searchTerm = signal('');
  readonly activeChat = this.chatService.activeChat;


  visibleChats = computed(() => {
    const filter = this.activeFilter();
    const term = this.searchTerm().trim().toLowerCase();

    return this.chatService.chats().filter(chat => {
      if (filter && chat.type !== filter) return false;
      if (term && !(chat.name ?? '').toLowerCase().includes(term)) return false;
      return true;
    });
  });


  selectChat(chat: Chat) {
    this.chatService.selectChat(chat);
  }

  toggleFilter(type: ChatType) {
    this.activeFilter.set(this.activeFilter() === type ? null : type);
  }

  clearSearch() {
    this.searchTerm.set('');
  }
}