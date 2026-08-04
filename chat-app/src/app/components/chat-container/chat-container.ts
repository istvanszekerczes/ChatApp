import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ChatService } from '../../services/chat';
import { MessageItem } from '../message-item/message-item';

@Component({
  selector: 'app-chat-container',
  imports: [FormsModule, MatIconModule, MessageItem],
  templateUrl: './chat-container.html',
  styleUrl: './chat-container.scss',
})
export class ChatContainer {
  private chatService = inject(ChatService);

  readonly activeChat = this.chatService.activeChat;
  readonly messages = this.chatService.messages;
  readonly loading = this.chatService.messagesLoading;

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

  /**
   * Sends a message with the current content of the messageText property.
   * If the messageText is empty or only contains whitespace, the method returns without sending.
   */
  send() {
    const content = this.messageText.trim();
    if (!content) return;
    this.chatService.sendMessage(content);
    this.messageText = '';
  }
}