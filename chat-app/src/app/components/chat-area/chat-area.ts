import { Component } from '@angular/core';
import {ChatContainer} from "../chat-container/chat-container";

@Component({
  selector: 'app-chat-area',
  imports: [ChatContainer],
  templateUrl: './chat-area.html',
  styleUrl: './chat-area.scss',
})
export class ChatArea {}
