import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-chat-input',
  imports: [FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './chat-input.html',
  styleUrl: './chat-input.scss',
})
export class ChatInput {
  messageText = '';

  sendMessage() {
    const content = this.messageText.trim();
    if (!content) return;

    // emit over socket here
    this.messageText = '';
  }
}