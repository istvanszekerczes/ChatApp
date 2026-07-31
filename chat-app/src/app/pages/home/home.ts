import { Component, signal, inject } from '@angular/core';
import { Profile } from '../../components/profile/profile';
import { ChatArea } from '../../components/chat-area/chat-area';
import { CreateChat } from '../../components/create-chat/create-chat';
import { DirectMessages } from '../../components/direct-messages/direct-messages';
import { UserList } from '../../components/user-list/user-list';
import { GroupChatList } from '../../components/group-chat-list/group-chat-list';
import { MatIconModule } from '@angular/material/icon';
import { PanelService } from '../../services/panel';


@Component({
  selector: 'app-home',
  imports: [Profile, ChatArea, CreateChat, DirectMessages, UserList, GroupChatList, MatIconModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  readonly panels = inject(PanelService);
  leftExpanded = signal(false);
  rightExpanded = signal(false);

  toggleLeft() {
    this.leftExpanded.update(v => !v);
  }

  toggleRight() {
    this.rightExpanded.update(v => !v);
  }
}
