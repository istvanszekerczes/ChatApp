import { Component, signal, inject } from '@angular/core';
import { Profile } from '../../components/profile/profile';
import { ChatArea } from '../../components/chat-area/chat-area';
import { CreateChat } from '../../components/create-chat/create-chat';
import { DirectMessagesList } from '../../components/direct-messages-list/direct-messages-list';  
import { UserList } from '../../components/user-list/user-list';
import { GroupChatList } from '../../components/group-chat-list/group-chat-list';
import { MatIconModule } from '@angular/material/icon';
import { PanelService } from '../../services/panel';
import { ChatTypePicker } from '../../components/chat-type-picker/chat-type-picker';

@Component({
  selector: 'app-home',
  imports: [Profile, ChatArea, CreateChat, DirectMessagesList, UserList, GroupChatList, MatIconModule, ChatTypePicker],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  readonly panels = inject(PanelService);
  leftExpanded = signal(false);
  rightExpanded = signal(false);
  activeTab = signal<'groups' | 'direct'>('groups');

  toggleLeft() {
    this.leftExpanded.update(v => !v);
  }

  toggleRight() {
    this.rightExpanded.update(v => !v);
  }
}
