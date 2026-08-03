import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth';
import { InitialPipe } from '../../pipes/initial-pipe';
import { MessageTimePipe } from '../../pipes/message-time-pipe';
import { Message } from '../../models/message';

@Component({
  selector: 'app-message-item',
  imports: [InitialPipe, MessageTimePipe],
  templateUrl: './message-item.html',
  styleUrl: './message-item.scss',
  host: {
    '[class.own]': 'isOwn()',
  },
})
export class MessageItem {
  private authService = inject(AuthService);

  readonly message = input.required<Message>();

  private currentUser = toSignal(this.authService.currentUser$);

  readonly isOwn = computed(() => this.currentUser()?.id === this.message().userId);

  readonly avatarColor = computed(() => this.message().user.avatarColor || '#3b82f6');
}