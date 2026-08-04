import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ChatService } from '../../services/chat';
import { InitialPipe } from '../../pipes/initial-pipe';
import { User } from '../../models/user';

interface DialogData {
  chatId: string;
  existingIds: string[];
}

@Component({
  selector: 'app-add-members-dialog',
  imports: [MatIconModule, InitialPipe],
  templateUrl: './add-members-dialog.html',
  styleUrl: './add-members-dialog.scss',
})
export class AddMembersDialog {
  private chatService = inject(ChatService);
  private dialogRef = inject(MatDialogRef<AddMembersDialog>);
  private data = inject<DialogData>(MAT_DIALOG_DATA);

  users = signal<User[]>([]);
  selectedIds = signal<Set<string>>(new Set());
  submitting = signal(false);
  errorMessage = signal('');

  readonly available = computed(() => {
    const existing = new Set(this.data.existingIds);
    return this.users().filter(u => !existing.has(u.id));
  });

  constructor() {
    this.chatService.getAllUsers().subscribe({
      next: users => this.users.set(users),
      error: () => this.errorMessage.set('Could not load users.'),
    });
  }

  toggle(id: string) {
    const next = new Set(this.selectedIds());
    next.has(id) ? next.delete(id) : next.add(id);
    this.selectedIds.set(next);
  }

  isSelected(id: string) {
    return this.selectedIds().has(id);
  }

  close() {
    this.dialogRef.close();
  }

  /**
   * Submits the selected user IDs to add them as participants to the chat.
   */
  submit() {
    const ids = [...this.selectedIds()];
    if (!ids.length) return;

    this.submitting.set(true);
    this.chatService.addParticipants(this.data.chatId, ids).subscribe({
      next: () => this.dialogRef.close(true),
      error: err => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.error ?? 'Could not add members.');
      },
    });
  }
}