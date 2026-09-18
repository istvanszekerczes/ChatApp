import { Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { ChatService } from '../../services/chat-service';
import { AuthService } from '../../../../core/services/auth-service';
import { InitialPipe } from '../../../../shared/pipes/initial-pipe';
import { User } from '../../../users/models/user';
import { MatDialog } from '@angular/material/dialog';
import { AddMembersDialog } from '../add-members-dialog/add-members-dialog';
import { UserService } from '../../../users/services/user-service';

@Component({
  selector: 'app-chat-info',
  imports: [MatIconModule, InitialPipe],
  templateUrl: './chat-info.html',
  styleUrl: './chat-info.scss',
})
export class ChatInfo {
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private userService = inject(UserService);

  readonly activeChat = this.chatService.activeChat;
  readonly participants = this.chatService.participants;
  readonly loading = this.chatService.participantsLoading;
  private dialog = inject(MatDialog);

  private currentUser = toSignal(this.authService.currentUser$);

  ngOnInit() {
    this.userService.listenForUserUpdates();
  }

  readonly isOwner = computed(() =>
    !!this.activeChat()?.creatorId &&
    this.activeChat()!.creatorId === this.currentUser()?.id
  );

  readonly typeLabels: Record<string, string> = {
    PUBLIC_GROUP: 'Public group',
    PRIVATE_GROUP: 'Private group',
    PROTECTED_GROUP: 'Protected group',
    DIRECT: 'Direct message',
  };

  isCreator(userId: string): boolean {
    return this.activeChat()?.creatorId === userId;
  }

  kick(user: User) {
    const chat = this.activeChat();
    if (!chat) return;
    if (!confirm(`Remove ${user.username} from this group?`)) return;

    this.chatService.removeParticipant(chat.id, user.id).subscribe({
      error: err => console.error('Failed to remove member', err),
    });
  }

  /**
   * Removes the current user from the active chat.
   */
  leave() {
    const chat = this.activeChat();
    const me = this.currentUser();
    if (!chat || !me) return;
    if (!confirm('Leave this group?')) return;

    this.chatService.removeParticipant(chat.id, me.id).subscribe({
      error: err => console.error('Failed to leave group', err),
    });
  }

  /**
   * Deletes the currently active chat.
   */
  deleteGroup() {
    const chat = this.activeChat();
    if (!chat) return;
    if (!confirm(`Delete "${chat.name}"? This cannot be undone.`)) return;

    this.chatService.deleteChat(chat.id).subscribe({
      error: err => console.error('Failed to delete group', err),
    });
  }

  /**
   * Opens the dialog to add members to the active chat.
   */
  openAddMembers() {
    const chat = this.activeChat();
    if (!chat) return;

    this.dialog.open(AddMembersDialog, {
      panelClass: 'chat-dialog-panel',
      autoFocus: false,
      data: {
        chatId: chat.id,
        existingIds: this.participants().map(p => p.id),
      },
    }).afterClosed().subscribe(added => {
      if (added) this.chatService.loadParticipants(chat.id);
    });
  }
}