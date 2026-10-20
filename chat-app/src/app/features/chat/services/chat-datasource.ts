import { Service, inject } from '@angular/core';
import { ChatService } from './chat-service';

@Service()
export class ChatDatasource {
  private chatService = inject(ChatService);
  private activeTab = this.chatService.activeTab;
  private activeFilter = this.chatService.activeFilter;

  getVisibleChats(term?: string) {
    const filter = this.activeFilter();
    const tab = this.activeTab();

    return this.chatService.chats().filter((chat) => {
      const fitsTab = tab === 'all' || (tab === 'groups' && chat.type !== 'DIRECT') || (tab === 'direct' && chat.type === 'DIRECT');
      const fitsFilter = !filter || tab === 'direct' || chat.type === filter;
      const fitsTerm = !term || (chat.name ?? '').toLowerCase().includes(term);
      
      return fitsTab && fitsFilter && fitsTerm;
    });
  }
}
