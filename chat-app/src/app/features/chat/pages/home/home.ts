import { Component, signal, inject } from '@angular/core';
import { Profile } from '../../../users/components/profile/profile';
import { ChatArea } from '../../components/chat-area/chat-area';
import { CreateChat } from '../../components/create-chat/create-chat';
import { UserList } from '../../../users/components/user-list/user-list';
import { GroupChatList } from '../../components/group-chat-list/group-chat-list';
import { MatIconModule } from '@angular/material/icon';
import { PanelService } from '../../../../core/services/panel-service';
import { ChatTypePicker } from '../../components/chat-type-picker/chat-type-picker';
import { DmList } from '../../components/dm-list/dm-list';
import { User } from '../../../users/models/user';
import { ChatService } from '../../../chat/services/chat-service';

@Component({
  selector: 'app-home',
  imports: [
    Profile,
    ChatArea,
    CreateChat,
    DmList,
    UserList,
    GroupChatList,
    MatIconModule,
    ChatTypePicker,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private chatService = inject(ChatService);
  readonly panels = inject(PanelService);
  leftExpanded = signal(false);
  rightExpanded = signal(false);
  activeTab = signal<'groups' | 'direct'>('groups');

  toggleLeft() {
    this.leftExpanded.update((v) => !v);
  }

  toggleRight() {
    this.rightExpanded.update((v) => !v);
  }

  onStartDm(user: User) {
    this.activeTab.set('direct');
    this.chatService.openDirectChat(user.id);
  }
}
