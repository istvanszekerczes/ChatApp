import { Service, NgZone, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { Chat, CreateChatPayload } from '../models/chat';
import { User } from '../models/user';
import { SocketService } from './socket';
import { Message } from '../models/message';
import { environment } from '../environments/environment';

@Service()
export class ChatService {
  private http = inject(HttpClient);
  private socketService = inject(SocketService);
  private zone = inject(NgZone);
  private apiUrl = environment.apiUrl;
  readonly chats = signal<Chat[]>([]);
  readonly loading = signal(false);
  private userListenerBound = false;

  private listening = false;

  readonly activeChat = signal<Chat | null>(null);
  readonly messages = signal<Message[]>([]);
  readonly messagesLoading = signal(false);

  private messageListenerBound = false;
  readonly participants = signal<User[]>([]);
  readonly participantsLoading = signal(false);

  private chatEventsBound = false;


  selectChat(chat: Chat) {
    if (this.activeChat()?.id === chat.id) return;

    const previousChatId = this.activeChat()?.id;
    if (previousChatId) {
      this.socketService.emit('leave_chat', previousChatId);
    }

    this.activeChat.set(chat);
    this.messages.set([]);
    this.participants.set([]);
    this.listenForMessages();
    this.socketService.emit('join_chat', chat.id);
    this.loadMessages(chat.id);
    if (chat.type !== 'PUBLIC_GROUP') {
      this.loadParticipants(chat.id);
    }
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

    this.socketService.on<Message>('receive_message').subscribe(msg => {
      if (msg.chatId !== this.activeChat()?.id) return;
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

   listenForUserUpdates() {
    if (this.userListenerBound) return;
    this.userListenerBound = true;

    this.socketService
      .on<{ id: string; username: string; avatarColor: string | null }>('user_updated')
      .subscribe(user => {
        this.zone.run(() => {
          this.messages.update(current =>
            current.map(msg =>
              msg.userId === user.id
                ? { ...msg, user: { ...msg.user, avatarColor: user.avatarColor } }
                : msg
            )
          );
        });
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

  loadParticipants(chatId: string) {
    this.participantsLoading.set(true);
    this.http
      .get<{ participants: User[] }>(`${this.apiUrl}/chats/${chatId}/participants`, {
        withCredentials: true,
      })
      .pipe(map(r => r.participants))
      .subscribe({
        next: participants => {
          if (this.activeChat()?.id !== chatId) return;
          this.participants.set(participants);
          this.participantsLoading.set(false);
        },
        error: () => this.participantsLoading.set(false),
      });
  }

  addParticipants(chatId: string, userIds: string[]): Observable<User[]> {
    return this.http
      .post<{ added: User[] }>(`${this.apiUrl}/chats/${chatId}/participants`,
        { userIds }, { withCredentials: true })
      .pipe(map(r => r.added));
  }

  removeParticipant(chatId: string, userId: string): Observable<unknown> {
    return this.http.delete(
      `${this.apiUrl}/chats/${chatId}/participants/${userId}`,
      { withCredentials: true }
    );
  }

  deleteChat(chatId: string): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/chats/${chatId}`, { withCredentials: true });
  }

  listenForChatEvents() {
    if (this.chatEventsBound) return;
    this.chatEventsBound = true;

    this.socketService.on<{ chatId: string }>('participants_changed').subscribe(({ chatId }) => {
      this.zone.run(() => {
        if (this.activeChat()?.id === chatId) this.loadParticipants(chatId);
      });
    });

    this.socketService.on<{ chatId: string }>('chat_deleted').subscribe(({ chatId }) => {
      this.zone.run(() => {
        this.chats.update(c => c.filter(chat => chat.id !== chatId));
        if (this.activeChat()?.id === chatId) this.closeActiveChat();
      });
    });

    this.socketService.on<{ chatId: string }>('removed_from_chat').subscribe(({ chatId }) => {
      this.zone.run(() => {
        this.chats.update(c => c.filter(chat => chat.id !== chatId));
        if (this.activeChat()?.id === chatId) this.closeActiveChat();
      });
    });

    this.socketService.on<{ chatId: string }>('added_to_chat').subscribe(() => {
      this.zone.run(() => this.loadChats());
    });
  }

  closeActiveChat() {
    this.activeChat.set(null);
    this.messages.set([]);
    this.participants.set([]);
  }
}