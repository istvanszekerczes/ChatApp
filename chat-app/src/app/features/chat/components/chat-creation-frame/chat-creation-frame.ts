import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { Chat } from '../../models/chat';
import { ChatTab } from '../../models/chat';
import { CreateChatDialog } from '../create-chat-dialog/create-chat-dialog';
import { CreateDmDialog } from '../create-dm-dialog/create-dm-dialog';

@Component({
  selector: 'app-chat-creation-frame',
  imports: [MatIconModule, CreateChatDialog, CreateDmDialog],
  templateUrl: './chat-creation-frame.html',
  styleUrl: './chat-creation-frame.scss',
})
export class ChatCreationFrame {
  private dialogRef = inject(MatDialogRef<ChatCreationFrame, Chat>);
  readonly ChatTab = ChatTab;

  chatTab = signal<ChatTab>(ChatTab.Groups);
  submitting = signal(false);


  switchTab(selectedTab: ChatTab) {
    this.chatTab.set(selectedTab);
  }

  close() {
    this.dialogRef.close();
  }
}
