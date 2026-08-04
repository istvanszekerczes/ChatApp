import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ChatService } from '../../services/chat';

@Component({
  selector: 'app-chat-input',
  imports: [FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './chat-input.html',
  styleUrl: './chat-input.scss',
})
export class ChatInput {
  private chatService = inject(ChatService);

  messageText = '';

  /**
   * Sends a message with the current content of the messageText property.
   * If the messageText is empty or only contains whitespace, the method returns without sending.
   */
  sendMessage() {
    const content = this.messageText.trim();
    if (!content) return;

    this.chatService.sendMessage(content);
    this.messageText = '';
  }
}