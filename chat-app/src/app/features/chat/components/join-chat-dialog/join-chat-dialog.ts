import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ChatService } from '../../services/chat-service';
import { InitialPipe } from '../../../../shared/pipes/initial-pipe';
import { Chat } from '../../models/chat';

@Component({
  selector: 'app-join-chat-dialog',
  imports: [FormsModule, MatIconModule, InitialPipe],
  templateUrl: './join-chat-dialog.html',
  styleUrl: './join-chat-dialog.scss',
})
export class JoinChatDialog {
  private chatService = inject(ChatService);
  private dialogRef = inject(MatDialogRef<JoinChatDialog, boolean>);
  readonly chat = inject<Chat>(MAT_DIALOG_DATA);

  password = '';
  submitting = signal(false);
  errorMessage = signal('');

  close() {
    this.dialogRef.close(false);
  }

  submit() {
    if (!this.password) {
      this.errorMessage.set('Enter the password.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    this.chatService.joinChat(this.chat.id, this.password).subscribe({
      next: () => this.dialogRef.close(true),
      error: err => {
        this.submitting.set(false);
        this.password = '';
        this.errorMessage.set(err.error?.error ?? 'Could not join chat.');
      },
    });
  }
}