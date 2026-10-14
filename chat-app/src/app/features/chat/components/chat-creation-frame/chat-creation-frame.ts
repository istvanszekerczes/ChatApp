import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { Chat, ChatType } from '../../models/chat';
import { ChatService } from '../../services/chat-service';
import { ChatTab } from '../chat-type-picker/chat-type-picker';

@Component({
  selector: 'app-chat-creation-frame',
  imports: [MatIconModule],
  templateUrl: './chat-creation-frame.html',
  styleUrl: './chat-creation-frame.scss',
})
export class ChatCreationFrame {
  private chatService = inject(ChatService);
  private dialogRef = inject(MatDialogRef<ChatCreationFrame, Chat>);

  chatTab = signal<ChatTab>('groups');
  


  switchTab(selectedTab: ChatTab) {
    this.chatTab.set(selectedTab);
  }

  close() {
    this.dialogRef.close();
  }






}
