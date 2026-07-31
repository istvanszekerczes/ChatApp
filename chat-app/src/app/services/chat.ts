import { Service, NgZone, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { Chat, CreateChatPayload } from '../models/chat';
import { User } from '../models/user';
import { SocketService } from './socket';
import { Message } from '../models/message';

@Service()
export class ChatService {
  private http = inject(HttpClient);
  private socketService = inject(SocketService);
  private zone = inject(NgZone);
  private apiUrl = 'http://localhost:3000/api';

  readonly chats = signal<Chat[]>([]);
  readonly loading = signal(false);

  private listening = false;

  readonly activeChat = signal<Chat | null>(null);
  readonly messages = signal<Message[]>([]);
  readonly messagesLoading = signal(false);

  private messageListenerBound = false;

  selectChat(chat: Chat) {
    if (this.activeChat()?.id === chat.id) return;

    this.activeChat.set(chat);
    this.messages.set([]);
    this.listenForMessages();
    this.socketService.emit('join_chat', chat.id);
    this.loadMessages(chat.id);
  }

  sendMessage(content: string) {
    const chat = this.activeChat();
    if (!chat || !content.trim()) return;
    this.socketService.emit('send_message', { chatId: chat.id, content: content.trim() });
  }

  private loadMessages(chatId: string) {
    this.messagesLoading.set(true);
    this.http
      .get<{ messages: Message[] }>(`${this.apiUrl}/chats/${chatId}/messages`, {
        withCredentials: true,
      })
      .pipe(map(r => r.messages))
      .subscribe({
        next: messages => {
          if (this.activeChat()?.id !== chatId) return;
          this.messages.set(messages);
          this.messagesLoading.set(false);
        },
        error: err => {
          console.error('Failed to load messages', err);
          this.messagesLoading.set(false);
        },
      });
  }

  private listenForMessages() {
    if (this.messageListenerBound) return;
    this.messageListenerBound = true;

    this.socketService.on<Message & { chatId?: string }>('receive_message').subscribe(msg => {
      this.zone.run(() => {
        this.messages.update(current =>
          current.some(m => m.id === msg.id) ? current : [...current, msg]
        );
      });
    });
  }

  listenForNewChats() {
    if (this.listening) return;
    this.listening = true;

    this.socketService.on<Chat>('chat_created').subscribe(chat => {
      console.log('[socket] chat_created', chat);
      this.zone.run(() => this.upsert(chat));
    });
  }

  loadChats() {
    this.loading.set(true);
    this.http
      .get<{ chats: Chat[] }>(`${this.apiUrl}/chats`, { withCredentials: true })
      .pipe(map(r => r.chats))
      .subscribe({
        next: chats => {
          this.chats.set(chats);
          this.loading.set(false);
        },
        error: err => {
          console.error('Failed to load chats', err);
          this.loading.set(false);
        },
      });
  }

  clearChats() {
    this.chats.set([]);
    this.activeChat.set(null);
    this.messages.set([]);
  }

  getAllUsers(): Observable<User[]> {
    return this.http
      .get<{ users: User[] }>(`${this.apiUrl}/users`, { withCredentials: true })
      .pipe(map(r => r.users));
  }

  createChat(payload: CreateChatPayload): Observable<Chat> {
    return this.http
      .post<{ chat: Chat }>(`${this.apiUrl}/chats`, payload, { withCredentials: true })
      .pipe(
        map(r => r.chat),
        tap(chat => this.upsert(chat))
      );
  }

  private upsert(chat: Chat) {
    this.chats.update(current =>
      current.some(c => c.id === chat.id) ? current : [chat, ...current]
    );
  }
}