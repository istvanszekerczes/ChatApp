import { Component, OnInit, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from './services/auth';
import { SocketService } from './services/socket';
import { ChatService } from './services/chat';

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

  constructor() {
    effect(() => {
      if (this.currentUser()) {
        this.socketService.connect();
        this.chatService.listenForNewChats();
        this.chatService.loadChats();
      } else {
        this.socketService.disconnect();
        this.chatService.clearChats();
      }
    });
  }

  ngOnInit() {
    this.authService.loadCurrentUser().subscribe();
  }
}