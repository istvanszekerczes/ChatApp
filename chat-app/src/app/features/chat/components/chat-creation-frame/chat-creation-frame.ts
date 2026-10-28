import { Component, inject, signal, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { Chat } from '../../models/chat';
import { ChatTab } from '../../models/chat';
import { CreateChatDialog } from '../create-chat-dialog/create-chat-dialog';
import { CreateDmDialog } from '../create-dm-dialog/create-dm-dialog';
import { ChatService } from '../../services/chat-service';
import { EMPTY, first, merge, mergeWith } from 'rxjs';
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

  dmComponent = viewChild(CreateDmDialog);
  groupComponent = viewChild(CreateChatDialog);

  switchTab(selectedTab: ChatTab) {
    this.chatTab.set(selectedTab);
  }

  close() {
    this.dialogRef.close();
  }

  submit() {
    this.submitting.set(true);

    const isDirect = this.chatTab() === ChatTab.Direct;
    const user = this.dmComponent()?.getSelectedUser();
    const payload = this.groupComponent()?.createPayload();

    const direct$ = isDirect && user ? this.chatService.createDirectChat(user.id) : EMPTY;
    const group$ = !isDirect && payload ? this.chatService.createChat(payload) : EMPTY;

    direct$.pipe(mergeWith(group$), first()).subscribe((chat) => {
      this.chatService.selectChat(chat);
      this.dialogRef.close(chat);
    });
  }
}
