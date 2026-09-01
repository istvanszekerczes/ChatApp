import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ChatService } from '../../services/chat-service';
import { Chat } from '../../models/chat';
import { ChatItem } from '../chat-item/chat-item';

@Component({
  selector: 'app-dm-list',
  imports: [MatIconModule, FormsModule, ChatItem],
  templateUrl: './dm-list.html',
  styleUrl: './dm-list.scss',
})
export class DmList {
  
  private chatService = inject(ChatService);

  readonly loading = this.chatService.loading;
  readonly activeChat = this.chatService.activeChat;

  searchTerm = signal('');

  readonly visibleChats = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    return this.chatService.chats().filter(chat => {
      if (chat.type !== 'DIRECT') return false;
      if (term && !(chat.name ?? '').toLowerCase().includes(term)) return false;
      return true;
    });
  });

  selectChat(chat: Chat) {
    this.chatService.selectChat(chat);
  }

  clearSearch() {
    this.searchTerm.set('');
  }}
