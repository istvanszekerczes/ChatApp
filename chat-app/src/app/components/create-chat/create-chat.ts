import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ChatService } from '../../services/chat';
import { ColorPicker } from '../color-picker/color-picker';
import { InitialPipe } from '../../pipes/initial-pipe'
import { ChatType } from '../../models/chat';
import { User } from '../../models/user';

@Component({
  selector: 'app-create-chat',
  imports: [FormsModule, MatIconModule, ColorPicker, InitialPipe],
  templateUrl: './create-chat.html',
  styleUrl: './create-chat.scss',
})
export class CreateChat {
  private chatService = inject(ChatService);

  readonly chatTypes: { value: ChatType; label: string; hint: string }[] = [
    { value: 'PUBLIC_GROUP', label: 'Public', hint: 'Anyone can find and join' },
    { value: 'PRIVATE_GROUP', label: 'Private', hint: 'Only invited users can see it' },
    { value: 'PROTECTED_GROUP', label: 'Protected', hint: 'Visible to all, password to join' },
  ];

  open = signal(false);
  users = signal<User[]>([]);
  selectedUserIds = signal<Set<string>>(new Set());
  submitting = signal(false);
  errorMessage = signal('');

  name = '';
  type: ChatType = 'PUBLIC_GROUP';
  password = '';
  avatarColor: string | null = '#3b82f6';

  openDialog() {
    this.reset();
    this.open.set(true);
    this.chatService.getAllUsers().subscribe({
      next: users => this.users.set(users),
      error: () => this.errorMessage.set('Could not load users.'),
    });
  }

  closeDialog() {
    this.open.set(false);
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
      next: () => {
        this.submitting.set(false);
        this.closeDialog();
      },
      error: err => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.error ?? 'Could not create chat.');
      },
    });
  }

  private reset() {
    this.name = '';
    this.type = 'PUBLIC_GROUP';
    this.password = '';
    this.avatarColor = '#3b82f6';
    this.selectedUserIds.set(new Set());
    this.errorMessage.set('');
  }
}