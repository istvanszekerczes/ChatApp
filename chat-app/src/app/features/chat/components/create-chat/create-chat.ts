import { Component, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { CreateChatDialog } from '../create-chat-dialog/create-chat-dialog';
import { CreateDmDialog } from '../create-dm-dialog/create-dm-dialog';

@Component({
  selector: 'app-create-chat',
  imports: [MatIconModule],
  templateUrl: './create-chat.html',
  styleUrl: './create-chat.scss',
})
export class CreateChat {
  private dialog = inject(MatDialog);

  readonly mode = input<'groups' | 'direct'>('groups');

  openDialog() {
    const config = { panelClass: 'chat-dialog-panel', autoFocus: false };

    if (this.mode() === 'direct') {
      this.dialog.open(CreateDmDialog, config);
    } else {
      this.dialog.open(CreateChatDialog, config);
    }
  }
}