import { Component, OnInit, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { EmojiPicker } from '../../../../shared/components/emoji-picker/emoji-picker';
import {MatInputModule} from '@angular/material/input';

@Component({
  selector: 'app-chat-input',
  imports: [FormsModule, MatIconModule, MatButtonModule, EmojiPicker, MatInputModule],
  templateUrl: './chat-input.html',
  styleUrl: './chat-input.scss',
})
export class ChatInput implements OnInit {
  messageText = '';
  showEmojiPicker = false;

  send = output<string>();

  ngOnInit() {
    this.messageText = '';
  }

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

  onEnter(event: Event) {
    const e = event as KeyboardEvent;
    if (e.shiftKey) return;
    e.preventDefault();
    this.onSend();
  }

  onEmojiSelect(emoji: string) {
    this.messageText += emoji;
    this.showEmojiPicker = false;
  }
}
