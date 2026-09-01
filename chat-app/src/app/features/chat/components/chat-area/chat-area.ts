import { Component, signal, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ChatContainer } from '../chat-container/chat-container';
import { ChatInfo } from '../chat-info/chat-info';
import { PanelService } from '../../../../core/services/panel-service';

@Component({
  selector: 'app-chat-area',
  imports: [ChatContainer, ChatInfo, MatIconModule],
  templateUrl: './chat-area.html',
  styleUrl: './chat-area.scss',
})
export class ChatArea {
  infoOpen = signal(false);
  readonly panels = inject(PanelService);

  toggleInfo() {
    this.infoOpen.update(open => !open);
  }
}