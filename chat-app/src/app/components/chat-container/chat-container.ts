import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ChatService } from '../../services/chat';
import { AuthService } from '../../services/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { InitialPipe } from '../../pipes/initial-pipe';

@Component({
  selector: 'app-chat-container',
  imports: [InitialPipe, MatIconModule, FormsModule],
  templateUrl: './chat-container.html',
  styleUrl: './chat-container.scss',
})
export class ChatContainer {
  private chatService = inject(ChatService);
  private authService = inject(AuthService);

  readonly activeChat = this.chatService.activeChat;
  readonly messages = this.chatService.messages;
  readonly loading = this.chatService.messagesLoading;
  readonly currentUser = toSignal(this.authService.currentUser$);

  private scrollAnchor = viewChild<ElementRef<HTMLElement>>('scrollAnchor');

  messageText = '';

  constructor() {
    effect(() => {
      this.messages();
      queueMicrotask(() => {
        this.scrollAnchor()?.nativeElement.scrollIntoView({ block: 'end' });
      });
    });
  }

  send() {
    const content = this.messageText.trim();
    if (!content) return;
    this.chatService.sendMessage(content);
    this.messageText = '';
  }

  isOwn(userId: string): boolean {
    return this.currentUser()?.id === userId;
  }
}
