import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { ChatService } from '../../services/chat';
import { JoinChatDialog } from '../join-chat-dialog/join-chat-dialog';
import { Chat, ChatType } from '../../models/chat';
import { ChatItem } from '../chat-item/chat-item';

@Component({
  selector: 'app-group-chat-list',
  imports: [MatIconModule, FormsModule, ChatItem],
  templateUrl: './group-chat-list.html',
  styleUrl: './group-chat-list.scss',
})
export class GroupChatList {
  private chatService = inject(ChatService);
  private dialog = inject(MatDialog);

  readonly loading = this.chatService.loading;
  readonly activeChat = this.chatService.activeChat;

  activeFilter = signal<ChatType>('PUBLIC_GROUP');
  searchTerm = signal('');

  visibleChats = computed(() => {
    const filter = this.activeFilter();
    const term = this.searchTerm().trim().toLowerCase();

    return this.chatService.chats().filter(chat => {
      if (chat.type !== filter) return false;
      if (term && !(chat.name ?? '').toLowerCase().includes(term)) return false;
      return true;
    });
  });

  setFilter(type: ChatType) {
    if (this.activeFilter() === type) return;
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
    if (chat.type === 'PROTECTED_GROUP' && !chat.isMember) {
      this.dialog
        .open(JoinChatDialog, {
          panelClass: 'chat-dialog-panel',
          data: chat,
        })
        .afterClosed()
        .subscribe(joined => {
          if (!joined) return;
          const updated = this.chatService.chats().find(c => c.id === chat.id);
          if (updated) this.chatService.selectChat(updated);
        });
      return;
    }

    this.chatService.selectChat(chat);
  }

  private closeIfHidden() {
    const active = this.chatService.activeChat();
    if (active && !this.visibleChats().some(c => c.id === active.id)) {
      this.chatService.closeActiveChat();
    }
  }
}