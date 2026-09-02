import { Component, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { EmojiPicker } from '../../../../shared/components/emoji-picker/emoji-picker';

@Component({
  selector: 'app-chat-input',
  imports: [FormsModule, MatIconModule, MatButtonModule, EmojiPicker],
  templateUrl: './chat-input.html',
  styleUrl: './chat-input.scss',
})
export class ChatInput {
  messageText = '';
  showEmojiPicker = false;

  send = output<string>();

  /**
   * Emits the trimmed message text via the `send` output and clears the input.
   * Does nothing if messageText is empty or only whitespace.
   */
  onSend() {
    const text = this.messageText.trim();
    if (!text) return;

    this.send.emit(text);
    this.messageText = '';
  }

  onEmojiSelect(emoji: string) {
    this.messageText += emoji;
    this.showEmojiPicker = false;
  }
} 