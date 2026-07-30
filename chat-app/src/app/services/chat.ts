import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Chat, CreateChatPayload } from '../models/chat';
import { User } from '../models/user';

@Service()
export class ChatService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  getAllUsers(): Observable<User[]> {
    return this.http
      .get<{ users: User[] }>(`${this.apiUrl}/users`, { withCredentials: true })
      .pipe(map(r => r.users));
  }

  createChat(payload: CreateChatPayload): Observable<Chat> {
    return this.http
      .post<{ chat: Chat }>(`${this.apiUrl}/chats`, payload, { withCredentials: true })
      .pipe(map(r => r.chat));
  }

  getChats(): Observable<Chat[]> {
  return this.http
    .get<{ chats: Chat[] }>(`${this.apiUrl}/chats`, { withCredentials: true })
    .pipe(map(r => r.chats));
}
}   