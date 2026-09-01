import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { toSignal } from '@angular/core/rxjs-interop';
import { ChatService } from '../../services/chat-service';
import { UserService } from '../../../users/services/user-service';
import { AuthService } from '../../../../core/services/auth-service';
import { InitialPipe } from '../../../../shared/pipes/initial-pipe';
import { User } from '../../../users/models/user';

@Component({
  selector: 'app-create-dm-dialog',
  imports: [FormsModule, MatIconModule, InitialPipe],
  templateUrl: './create-dm-dialog.html',
  styleUrl: './create-dm-dialog.scss',
})
export class CreateDmDialog {
  private chatService = inject(ChatService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private dialogRef = inject(MatDialogRef<CreateDmDialog>);

  private currentUser = toSignal(this.authService.currentUser$);

  searchTerm = signal('');
  submitting = signal(false);
  errorMessage = signal('');

  readonly candidates = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const meId = this.currentUser()?.id;
    return this.userService.users()
      .filter(u => u.id !== meId)
      .filter(u => !term || u.username.toLowerCase().includes(term));
  });

  close() {
    this.dialogRef.close();
  }

  start(user: User) {
    this.submitting.set(true);
    this.chatService.createDirectChat(user.id).subscribe({
      next: chat => {
        this.chatService.selectChat(chat);
        this.dialogRef.close(chat);
      },
      error: err => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.error ?? 'Could not start conversation.');
      },
    });
  }
}