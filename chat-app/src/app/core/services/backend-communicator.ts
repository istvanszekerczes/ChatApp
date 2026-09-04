import { Service, inject } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { SocketService } from './socket-service';
import { Message } from '../../features/chat/models/message';
import { Chat, CreateChatPayload } from '../../features/chat/models/chat';
import { User, PresenceEvent, NewUserEvent } from '../../features/users/models/user';
import { Observable } from 'rxjs';

@Service()
export class BackendCommunicator {
  private socketService = inject(SocketService);
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  //       ---   Chat related communications   ---

  public sendMessage(chatId: string, content: string) {
    this.socketService.emit('send_message', { chatId, content });
  }

  public loadMessages(chatId: string) {
    return this.http.get<{ messages: Message[] }>(`${this.apiUrl}/chats/${chatId}/messages`, {
      withCredentials: true,
    });
  }

  public listenForMessages() {
    return this.socketService.on<Message>('receive_message');
  }

  public refreshChatCount(chatId: string) {
    return this.http.get<{ chats: Chat[] }>(`${this.apiUrl}/chats`, {
      withCredentials: true,
    });
  }

  public listenForNewChats() {
    return this.socketService.on<Chat>('chat_created');
  }

  public loadChats() {
    return this.http.get<{ chats: Chat[] }>(`${this.apiUrl}/chats`, {
      withCredentials: true,
    });
  }

  public createChat(payload: CreateChatPayload) {
    return this.http.post<{ chat: Chat }>(`${this.apiUrl}/chats`, payload, {
      withCredentials: true,
    });
  }

  public createDirectChat(targetId: string) {
    return this.http.post<{ chat: Chat }>(
      `${this.apiUrl}/chats/direct`,
      { targetId },
      {
        withCredentials: true,
      },
    );
  }

  public loadParticipants(chatId: string) {
    return this.http.get<{ participants: User[] }>(`${this.apiUrl}/chats/${chatId}/participants`, {
      withCredentials: true,
    });
  }

  public addParticpants(chatId: string, userIds: string[]) {
    return this.http.post<{ added: User[] }>(
      `${this.apiUrl}/chats/${chatId}/participants`,
      { userIds },
      {
        withCredentials: true,
      },
    );
  }

  public removeParticipants(chatId: string, userId: string) {
    return this.http.delete(`${this.apiUrl}/chats/${chatId}/participants/${userId}`, {
      withCredentials: true,
    });
  }

  public deleteChat(chatId: string) {
    return this.http.delete(`${this.apiUrl}/chats/${chatId}`, { withCredentials: true });
  }

  public listenForParticipantsChanged() {
    return this.socketService.on<{ chatId: string }>('participants_changed');
  }

  public listenForChatDeleted() {
    return this.socketService.on<{ chatId: string }>('chat_deleted');
  }

  public listenForRemovedFromChat() {
    return this.socketService.on<{ chatId: string }>('removed_from_chat');
  }

  public listenForAddedToChat() {
    return this.socketService.on<{ chatId: string }>('added_to_chat');
  }

  public joinChat(chatId: string, password?: string) {
    return this.http.post(
      `${this.apiUrl}/chats/${chatId}/join`,
      { password },
      { withCredentials: true },
    );
  }

  //       ---   User related communications   ---

  public loadUsers() {
    return this.http.get<{ users: User[] }>(`${this.apiUrl}/users`, { withCredentials: true });
  }

  public listenForUserUpdates() {
    return this.socketService.on<{ id: string; username: string; avatarColor: string | null }>(
      'user_updated',
    );
  }

  public getAllUsers() {
    return this.http.get<{ users: User[] }>(`${this.apiUrl}/users`, { withCredentials: true });
  }

  public listenForNewUsers() {
    return this.socketService.on<NewUserEvent>('user_registered');
  }

  public updateAvatarColor(avatarColor: string) {
    return this.http.patch<{ user: User }>(
      `${this.apiUrl}/auth/me`,
      { avatarColor },
      { withCredentials: true },
    );
  }

  public listenForPresence() {
    return this.socketService.on<PresenceEvent>('presence_changed');
  }


  //       ---   Auth related communications   ---

  public register(userData: { email: string; username: string; password: string }) {
    return this.http.post<{ message: string; userId: string }>(
      `${this.apiUrl}/auth/register`,
      userData,
      { withCredentials: true },
    );
  }

  public login(credentials: { email: string; password: string }) {
    return this.http.post<{ message: string; user: User }>(
      `${this.apiUrl}/auth/login`,
      credentials,
      { withCredentials: true },
    );
  }

  public logout() {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true });
  }

  public loadCurrentUser() {
    return this.http.get<{ user: User }>(`${this.apiUrl}/auth/me`, { withCredentials: true });
  }
}
