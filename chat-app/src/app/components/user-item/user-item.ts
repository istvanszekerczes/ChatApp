import { Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { InitialPipe } from '../../pipes/initial-pipe';
import { MessageTimePipe } from '../../pipes/message-time-pipe';
import { User } from '../../models/user';

@Component({
  selector: 'app-user-item',
  imports: [MatIconModule, InitialPipe, MessageTimePipe],
  templateUrl: './user-item.html',
  styleUrl: './user-item.scss',
})
export class UserItem {
  readonly user = input.required<User>();
  readonly message = output<User>();

  readonly avatarColor = computed(() => this.user().avatarColor || '#3b82f6');
}