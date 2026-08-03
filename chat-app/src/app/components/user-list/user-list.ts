import { Component, computed, inject } from '@angular/core';
import { UserService } from '../../services/user';
import { UserItem } from '../user-item/user-item';
import { User } from '../../models/user';

@Component({
  selector: 'app-user-list',
  imports: [UserItem],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
})
export class UserList {
  private userService = inject(UserService);

  readonly loading = this.userService.loading;

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

  onMessage(user: User) {
    console.log('start DM with', user.username);
  }
}