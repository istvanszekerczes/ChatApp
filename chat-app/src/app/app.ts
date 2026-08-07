import { Component, OnInit, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from './services/auth';
import { SocketService } from './services/socket';
import { ChatService } from './services/chat';
import { UserService } from './services/user';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private authService = inject(AuthService);
  private socketService = inject(SocketService);
  private chatService = inject(ChatService);

  private currentUser = toSignal(this.authService.currentUser$);
  private userService = inject(UserService);

  constructor() {
    effect(() => {
      if (this.currentUser()) {
        this.socketService.connect();
        this.chatService.listenForNewChats();
        this.chatService.listenForUserUpdates();
        this.chatService.loadChats();
        this.chatService.listenForChatEvents();
        this.userService.listenForPresence();
        this.userService.loadUsers();
        this.userService.listenForNewUsers();
        this.userService.listenForUserUpdates();
      } else {
        this.socketService.disconnect();
        this.chatService.clearChats();
        this.userService.clearUsers();
      }
    });
  }

  ngOnInit() {
    this.authService.loadCurrentUser().subscribe();
  }
}