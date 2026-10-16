import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { Chat, ChatType } from '../../models/chat';
import { ChatService } from '../../services/chat-service';
import { ChatTab } from '../chat-type-picker/chat-type-picker';
import { CreateChatDialog } from '../create-chat-dialog/create-chat-dialog';
import { CreateDmDialog } from '../create-dm-dialog/create-dm-dialog';

@Component({
  selector: 'app-chat-creation-frame',
  imports: [MatIconModule, CreateChatDialog, CreateDmDialog],
  templateUrl: './chat-creation-frame.html',
  styleUrl: './chat-creation-frame.scss',
})
export class ChatCreationFrame {
  private chatService = inject(ChatService);
  private createChatDialog = CreateChatDialog;
  private dialogRef = inject(MatDialogRef<ChatCreationFrame, Chat>);

  chatTab = signal<ChatTab>('groups');
  submitting = signal(false);


  switchTab(selectedTab: ChatTab) {
    this.chatTab.set(selectedTab);
  }

  close() {
    this.dialogRef.close();
  }

  submit() {
  }
}
