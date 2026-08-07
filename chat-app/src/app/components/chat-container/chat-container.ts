import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ChatService } from '../../services/chat';
import { MessageItem } from '../message-item/message-item';
import { ChatInput } from '../chat-input/chat-input';

@Component({
  selector: 'app-chat-container',
  imports: [MatIconModule, MessageItem, ChatInput],
  templateUrl: './chat-container.html',
  styleUrl: './chat-container.scss',
})
export class ChatContainer {
  private chatService = inject(ChatService);

  readonly activeChat = this.chatService.activeChat;
  readonly messages = this.chatService.messages;
  readonly loading = this.chatService.messagesLoading;

  private scrollAnchor = viewChild<ElementRef<HTMLElement>>('scrollAnchor');

  constructor() {
    effect(() => {
      this.messages();
      queueMicrotask(() => {
        this.scrollAnchor()?.nativeElement.scrollIntoView({ block: 'end' });
      });
    });
  }

  /**
   * Sends the given message content with the ChatService.
   */
  send(text: string) {
    this.chatService.sendMessage(text);
  }
}