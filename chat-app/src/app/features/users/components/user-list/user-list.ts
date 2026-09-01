import { UserService } from '../../services/user-service';
import { UserItem } from '../user-item/user-item';
import { User } from '../../models/user';
import { ChatService } from '../../../chat/services/chat-service';
import { Component, computed, inject, input, output } from '@angular/core';


@Component({
  selector: 'app-user-list',
  imports: [UserItem],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
})
export class UserList {
  private userService = inject(UserService);

  readonly loading = this.userService.loading;

  private chatService = inject(ChatService);

  ngOnInit() {
    this.userService.listenForUserUpdates();
  }

  readonly onlineUsers = computed(() =>
    this.userService.users().filter(u => u.online)
  );

  readonly offlineUsers = computed(() =>
    this.userService.users()
      .filter(u => !u.online)
      .sort((a, b) => {
        if (!a.lastOnline) return 1;
        if (!b.lastOnline) return -1;
        return new Date(b.lastOnline).getTime() - new Date(a.lastOnline).getTime();
      })
  );

  readonly messageUser = output<User>();

  onMessage(user: User) {
    this.messageUser.emit(user);
    this.chatService.openDirectChat(user.id);
  }
}