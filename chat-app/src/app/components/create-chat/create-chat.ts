import { Component, inject, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { CreateChatDialog } from '../create-chat-dialog/create-chat-dialog';
import { Chat } from '../../models/chat';

@Component({
  selector: 'app-create-chat',
  imports: [MatIconModule],
  templateUrl: './create-chat.html',
  styleUrl: './create-chat.scss',
})
export class CreateChat {
  private dialog = inject(MatDialog);

  openDialog() {
    this.dialog.open(CreateChatDialog, { panelClass: 'chat-dialog-panel', autoFocus: false });
  }
}