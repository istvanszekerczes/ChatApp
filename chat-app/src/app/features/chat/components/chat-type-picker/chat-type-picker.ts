import { Component, inject, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ChatService } from '../../services/chat-service';
import { Router } from '@angular/router';
import { ChatTab } from '../../models/chat';

@Component({
  selector: 'app-chat-type-picker',
  imports: [MatIconModule],
  templateUrl: './chat-type-picker.html',
  styleUrl: './chat-type-picker.scss',
})
export class ChatTypePicker {
  private chatService = inject(ChatService);
  private router = inject(Router);
  readonly ChatTab = ChatTab;
  readonly activeTab = this.chatService.activeTab;

  setTab(tab: ChatTab) {  
    if (this.activeTab() === tab) return;
    this.activeTab.set(tab);
    this.router.navigate(['']);
    this.chatService.closeActiveChat();
  }
}