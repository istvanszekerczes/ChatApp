import { Component } from '@angular/core';
import {ChatInput} from "../chat-input/chat-input";

@Component({
  selector: 'app-chat-container',
  imports: [ChatInput],
  templateUrl: './chat-container.html',
  styleUrl: './chat-container.scss',
})
export class ChatContainer {}
