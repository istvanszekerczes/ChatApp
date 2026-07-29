import { Component } from '@angular/core';
import {ChatContainer} from "../chat-container/chat-container";
import {ChatInfo} from "../chat-info/chat-info";

@Component({
  selector: 'app-chat-area',
  imports: [ChatContainer, ChatInfo],
  templateUrl: './chat-area.html',
  styleUrl: './chat-area.scss',
})
export class ChatArea {}
