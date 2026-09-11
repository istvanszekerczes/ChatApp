import { Component, signal, inject, computed, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';

import { Profile } from '../../../users/components/profile/profile';
import { ChatArea } from '../../components/chat-area/chat-area';
import { CreateChat } from '../../components/create-chat/create-chat';
import { UserList } from '../../../users/components/user-list/user-list';
import { GroupChatList } from '../../components/group-chat-list/group-chat-list';
import { ChatTypePicker } from '../../components/chat-type-picker/chat-type-picker';
import { DmList } from '../../components/dm-list/dm-list';
import { ErrorDialog } from '../../../../shared/components/error-dialog/error-dialog';

import { PanelService } from '../../../../core/services/panel-service';
import { ChatService } from '../../../chat/services/chat-service';

import { User } from '../../../users/models/user';
import { Chat } from '../../models/chat';

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
  private router = inject(Router);
  private chatService = inject(ChatService);
  readonly panels = inject(PanelService);
  leftExpanded = signal(false);
  rightExpanded = signal(false);
  activeTab = signal<'groups' | 'direct'>('groups');

  private route = inject(ActivatedRoute);
  private data = toSignal(this.route.data);
  chat = computed(() => this.data()?.['chat'] as Chat);

  private dialog = inject(MatDialog);

  constructor() {
    effect(() => {
      const chat = this.chat();
      if (chat) this.chatService.selectChat(chat);
    });
  }

  ngOnInit() {
    if (this.router.url === '/error') {
      this.dialog.open(ErrorDialog, {
        disableClose: true 
      });
    }
  }

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
