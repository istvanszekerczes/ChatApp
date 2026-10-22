import { Component, inject, signal, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { Chat } from '../../models/chat';
import { ChatTab } from '../../models/chat';
import { CreateChatDialog } from '../create-chat-dialog/create-chat-dialog';
import { CreateDmDialog } from '../create-dm-dialog/create-dm-dialog';
import { ChatService } from '../../services/chat-service';
import { User } from '../../../users/models/user';

@Component({
  selector: 'app-chat-creation-frame',
  imports: [MatIconModule, CreateChatDialog, CreateDmDialog],
  templateUrl: './chat-creation-frame.html',
  styleUrl: './chat-creation-frame.scss',
})
export class ChatCreationFrame {
  private chatService = inject(ChatService);
  private dialogRef = inject(MatDialogRef<ChatCreationFrame, Chat>);

  readonly ChatTab = ChatTab;

  chatTab = signal<ChatTab>(ChatTab.Groups);
  submitting = signal(false);
  errorMessage = signal('');
  dmComponent = viewChild(CreateDmDialog);

  switchTab(selectedTab: ChatTab) {
    this.chatTab.set(selectedTab);
  }

  close() {
    this.dialogRef.close();
  }

  submit() {
    if (this.chatTab() === ChatTab.Direct) {
      const user = this.dmComponent()?.getSelectedUser();
      if (!user) return;
      this.submitting.set(true);
      this.chatService.createDirectChat(user.id).subscribe({
        next: (chat) => {
          this.chatService.selectChat(chat);
          this.dialogRef.close(chat);
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err.error?.error ?? 'Could not start conversation.');
        },
      });
    } else {

    }
  }
}
