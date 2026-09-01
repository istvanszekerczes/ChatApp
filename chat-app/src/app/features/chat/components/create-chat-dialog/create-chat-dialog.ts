import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { ChatService } from '../../services/chat-service';
import { ColorPicker } from '../../../../shared/components/color-picker/color-picker';
import { InitialPipe } from '../../../../shared/pipes/initial-pipe';
import { Chat, ChatType } from '../../models/chat';
import { User } from '../../../users/models/user';

@Component({
  selector: 'app-create-chat-dialog',
  imports: [FormsModule, MatIconModule, ColorPicker, InitialPipe],
  templateUrl: './create-chat-dialog.html',
  styleUrl: './create-chat-dialog.scss',
})
export class CreateChatDialog {
  private chatService = inject(ChatService);
  private dialogRef = inject(MatDialogRef<CreateChatDialog, Chat>);

  readonly chatTypes: { value: ChatType; label: string; hint: string }[] = [
    { value: 'PUBLIC_GROUP', label: 'Public', hint: 'Anyone can find and join' },
    { value: 'PRIVATE_GROUP', label: 'Private', hint: 'Only invited users can see it' },
    { value: 'PROTECTED_GROUP', label: 'Protected', hint: 'Visible to all, password to join' },
  ];

  users = signal<User[]>([]);
  selectedUserIds = signal<Set<string>>(new Set());
  submitting = signal(false);
  errorMessage = signal('');

  name = '';
  type: ChatType = 'PUBLIC_GROUP';
  password = '';
  avatarColor: string | null = '#3b82f6';

  constructor() {
    this.chatService.getAllUsers().subscribe({
      next: users => this.users.set(users),
      error: () => this.errorMessage.set('Could not load users.'),
    });
  }

  close() {
    this.dialogRef.close();
  }

  toggleUser(id: string) {
    const next = new Set(this.selectedUserIds());
    next.has(id) ? next.delete(id) : next.add(id);
    this.selectedUserIds.set(next);
  }

  isSelected(id: string) {
    return this.selectedUserIds().has(id);
  }

  submit() {
    this.errorMessage.set('');

    if (!this.name.trim()) {
      this.errorMessage.set('Give the group a name.');
      return;
    }
    if (this.type === 'PROTECTED_GROUP' && this.password.length < 4) {
      this.errorMessage.set('Password must be at least 4 characters.');
      return;
    }

    this.submitting.set(true);
    this.chatService.createChat({
      type: this.type,
      name: this.name.trim(),
      avatarColor: this.avatarColor,
      ...(this.type === 'PROTECTED_GROUP' ? { password: this.password } : {}),
      ...(this.type === 'PRIVATE_GROUP'
        ? { participantIds: [...this.selectedUserIds()] }
        : {}),
    }).subscribe({
      next: chat => {
        this.submitting.set(false);
        this.dialogRef.close(chat);
      },
      error: err => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.error ?? 'Could not create chat.');
      },
    });
  }
}