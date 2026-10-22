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
import { ChatCreationFrame } from '../chat-creation-frame/chat-creation-frame';

@Component({
  selector: 'app-create-dm-dialog',
  imports: [FormsModule, MatIconModule, InitialPipe],
  templateUrl: './create-dm-dialog.html',
  styleUrl: './create-dm-dialog.scss',
})
export class CreateDmDialog {
  private userService = inject(UserService);
  private authService = inject(AuthService);

  private currentUser = toSignal(this.authService.currentUser$);

  searchTerm = signal('');
  selectedUser = signal<User | undefined>(undefined);
  submitting = signal(false);

  readonly candidates = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const meId = this.currentUser()?.id;
    return this.userService.users()
      .filter(u => u.id !== meId)
      .filter(u => !term || u.username.toLowerCase().includes(term));
  });

  selectUser(user: User) {
    if (user === this.selectedUser()) return;
    this.selectedUser.set(user);
  }

  getSelectedUser() {
    return this.selectedUser();
  }

  isSelected(u: User) {
    return this.selectedUser()?.id === u.id;
  }
}