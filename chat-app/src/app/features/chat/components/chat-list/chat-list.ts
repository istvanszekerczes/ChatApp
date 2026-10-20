import { Component, inject, signal, computed, effect, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ChatService } from '../../services/chat-service';
import { Chat, ChatType } from '../../models/chat';
import { ChatItem } from '../chat-item/chat-item';
import { Router } from '@angular/router';

@Component({
  selector: 'app-chat-list',
  imports: [MatIconModule, FormsModule, ChatItem],
  templateUrl: './chat-list.html',
  styleUrl: './chat-list.scss',
})
export class ChatList {
  private chatService = inject(ChatService);

  readonly loading = this.chatService.loading;
  readonly activeChat = this.chatService.activeChat;
  private router = inject(Router);
  activeFilter = this.chatService.activeFilter;
  searchTerm = signal('');
  activeTab = this.chatService.activeTab;
  private previousTab = this.activeTab();

  constructor () {
    effect(() => {
      const tab = this.activeTab();
      if (tab === this.previousTab) return;
      this.previousTab = tab;

      untracked(() => {
        this.activeFilter.set(null);
        this.closeIfHidden();
      });
    });
  }

  visibleChats = computed(() => {
    const filter = this.activeFilter();
    const tab = this.activeTab();
    const term = this.searchTerm().trim().toLowerCase();

    return this.chatService.chats().filter((chat) => {
      if (filter && tab !== 'direct' && chat.type !== filter) return false;
      if (tab === 'groups' && chat.type === 'DIRECT') return false;
      if (tab === 'direct' && chat.type !== 'DIRECT') return false;
      if (term && !(chat.name ?? '').toLowerCase().includes(term)) return false;
      return true;
    });
});

  setFilter(type: ChatType) {
    if (this.activeFilter() === type)  {
      this.activeFilter.set(null);
      return;
    }
    this.router.navigate(['']);
    this.chatService.closeActiveChat();
    this.activeFilter.set(type);
    this.closeIfHidden();
  }

  onSearchChange(value: string) {
    this.searchTerm.set(value);
    this.closeIfHidden();
  }

  clearSearch() {
    this.searchTerm.set('');
    this.closeIfHidden();
  }

  selectChat(chat: Chat) {
    if (chat.id === this.chatService.activeChatId()) {
      return;
    }
    this.chatService.closeActiveChat();
    this.router.navigate(['/chat', chat.id]);
  }

  private closeIfHidden() {
    const active = this.chatService.activeChat();
    if (active && !this.visibleChats().some((c) => c.id === active.id)) {
      this.chatService.closeActiveChat();
    }
  }
}
