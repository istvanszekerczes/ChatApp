import { Component } from '@angular/core';
import { Profile } from '../../components/profile/profile';
import { ChatArea } from '../../components/chat-area/chat-area';
import { CreateChat } from '../../components/create-chat/create-chat';
import { DirectMessages } from '../../components/direct-messages/direct-messages';
import { UserList } from '../../components/user-list/user-list';
import { GroupChatList } from '../../components/group-chat-list/group-chat-list';


@Component({
  selector: 'app-home',
  imports: [Profile, ChatArea, CreateChat, DirectMessages, UserList, GroupChatList],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

}
