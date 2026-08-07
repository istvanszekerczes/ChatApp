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

  /**
   * Selects a chat to view its messages and participants.
   *
   * @param chat The chat to select.
   * @returns void
   * If the chat is already selected, it does nothing.
   * If a different chat is selected, it leaves the previous chat and joins the new one.
   */
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

  /**
   * Sends a message in the currently selected chat.
   *
   * @param content The content of the message to send.
   * @returns void
   */
  sendMessage(content: string) {
    const chat = this.activeChat();
    if (!chat || !content.trim()) return;
    this.socketService.emit('send_message', { chatId: chat.id, content: content.trim() });
  }

  /**
   * Loads the messages for the specified chat.
   *
   * @param chatId The ID of the chat for which to load messages.
   * @returns void
   */
  private loadMessages(chatId: string) {
    this.messagesLoading.set(true);
    this.http
      .get<{ messages: Message[] }>(`${this.apiUrl}/chats/${chatId}/messages`, {
        withCredentials: true,
      })
      .pipe(map((r) => r.messages))
      .subscribe({
        next: (messages) => {
          if (this.activeChat()?.id !== chatId) return;
          this.messages.set(messages);
          this.messagesLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load messages', err);
          this.messagesLoading.set(false);
        },
      });
  }

  /**
   * Listens for incoming messages in the currently selected chat.
   *
   * @returns void
   */
  private listenForMessages() {
    if (this.messageListenerBound) return;
    this.messageListenerBound = true;

    this.socketService.on<Message>('receive_message').subscribe((msg) => {
      if (msg.chatId !== this.activeChat()?.id) return;
      this.zone.run(() => {
        this.messages.update((current) =>
          current.some((m) => m.id === msg.id) ? current : [...current, msg],
        );
      });
    });
  }

  /**
   * Refreshes the message count for the specified chat.
   *
   * @param chatId The ID of the chat for which to refresh the count.
   * @returns void
   */
  private refreshChatCount(chatId: string) {
    this.http
      .get<{ chats: Chat[] }>(`${this.apiUrl}/chats`, { withCredentials: true })
      .pipe(map((r) => r.chats.find((c) => c.id === chatId)))
      .subscribe((updated) => {
        if (!updated) return;
        this.chats.update((current) => current.map((c) => (c.id === chatId ? updated : c)));
        if (this.activeChat()?.id === chatId) {
          this.activeChat.set(updated);
        }
      });
  }

  /**
   * Listens for new chats created by other users.
   *
   * @returns void
   */
  listenForNewChats() {
    if (this.listening) return;
    this.listening = true;

    this.socketService.on<Chat>('chat_created').subscribe((chat) => {
      console.log('[socket] chat_created', chat);
      this.zone.run(() => this.upsert(chat));
    });
  }

  /**
   * Listens for updates to user information, such as avatar color changes.
   *
   * @returns void
   */
  listenForUserUpdates() {
  if (this.userListenerBound) return;
  this.userListenerBound = true;

  this.socketService
    .on<{ id: string; username: string; avatarColor: string | null }>('user_updated')
    .subscribe((user) => {
      this.zone.run(() => {
        this.messages.update((current) =>
          current.map((msg) =>
            msg.userId === user.id
              ? { ...msg, user: { ...msg.user, avatarColor: user.avatarColor } }
              : msg,
          ),
        );

        this.participants.update((current) =>
          current.map((p) =>
            p.id === user.id ? { ...p, avatarColor: user.avatarColor, username: user.username } : p,
          ),
        );
      });
    });
}

  /**
   * Loads the list of chats for the current user.
   *
   * @returns void
   */
  loadChats() {
    this.loading.set(true);
    this.http
      .get<{ chats: Chat[] }>(`${this.apiUrl}/chats`, { withCredentials: true })
      .pipe(map((r) => r.chats))
      .subscribe({
        next: (chats) => {
          this.chats.set(chats);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load chats', err);
          this.loading.set(false);
        },
      });
  }

  /**
   * Clears the list of chats and resets the active chat and messages.
   *
   * @returns void
   */
  clearChats() {
    this.chats.set([]);
    this.activeChat.set(null);
    this.messages.set([]);
  }

  /**
   * Loads the list of all users.
   *
   * @returns An Observable of the list of users.
   */
  getAllUsers(): Observable<User[]> {
    return this.http
      .get<{ users: User[] }>(`${this.apiUrl}/users`, { withCredentials: true })
      .pipe(map((r) => r.users));
  }

  /**
   * Creates a new chat with the provided payload.
   *
   * @param payload The data for the new chat.
   * @returns An Observable of the created chat.
   */
  createChat(payload: CreateChatPayload): Observable<Chat> {
    return this.http
      .post<{ chat: Chat }>(`${this.apiUrl}/chats`, payload, { withCredentials: true })
      .pipe(
        map((r) => r.chat),
        tap((chat) => this.upsert(chat)),
      );
  }

  /**
   * Creates a new direct chat with the specified target user.
   *
   * @param targetId The ID of the target user.
   * @returns An Observable of the created chat.
   */
  createDirectChat(targetId: string): Observable<Chat> {
    return this.http
      .post<{ chat: Chat }>(`${this.apiUrl}/chats/direct`, { targetId }, { withCredentials: true })
      .pipe(
        map((r) => r.chat),
        tap((chat) => this.upsert(chat)),
      );
  }

  /**
   * Opens a direct chat with the specified target user.
   *
   * @param targetId The ID of the target user.
   * @returns void
   */
  openDirectChat(targetId: string) {
    const existing = this.chats().find((c) => c.type === 'DIRECT' && c.otherUserId === targetId);
    if (existing) {
      this.selectChat(existing);
      return;
    }
    this.createDirectChat(targetId).subscribe({
      next: (chat) => this.selectChat(chat),
      error: (err) => console.error('Failed to open conversation', err),
    });
  }

  /**
   * Updates or inserts a chat into the list of chats.
   *
   * @param chat The chat to update or insert.
   * @returns void
   */
  private upsert(chat: Chat) {
    this.chats.update((current) =>
      current.some((c) => c.id === chat.id) ? current : [chat, ...current],
    );
  }

  /**
   * Loads the participants of a specified chat.
   *
   * @param chatId The ID of the chat for which to load participants.
   * @returns void
   */
  loadParticipants(chatId: string) {
    this.participantsLoading.set(true);
    this.http
      .get<{ participants: User[] }>(`${this.apiUrl}/chats/${chatId}/participants`, {
        withCredentials: true,
      })
      .pipe(map((r) => r.participants))
      .subscribe({
        next: (participants) => {
          if (this.activeChat()?.id !== chatId) return;
          this.participants.set(participants);
          this.participantsLoading.set(false);
        },
        error: () => this.participantsLoading.set(false),
      });
  }

  /**
   * Adds participants to a specified chat.
   *
   * @param chatId The ID of the chat to which to add participants.
   * @param userIds The IDs of the users to add.
   * @returns An Observable of the updated list of participants.
   */
  addParticipants(chatId: string, userIds: string[]): Observable<User[]> {
    return this.http
      .post<{ added: User[] }>(
        `${this.apiUrl}/chats/${chatId}/participants`,
        { userIds },
        { withCredentials: true },
      )
      .pipe(map((r) => r.added));
  }

  /**
   * Removes a participant from a specified chat.
   *
   * @param chatId The ID of the chat from which to remove the participant.
   * @param userId The ID of the user to remove.
   * @returns An Observable indicating the success or failure of the operation.
   */
  removeParticipant(chatId: string, userId: string): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/chats/${chatId}/participants/${userId}`, {
      withCredentials: true,
    });
  }

  /**
   * Deletes a specified chat.
   *
   * @param chatId The ID of the chat to delete.
   * @returns An Observable indicating the success or failure of the operation.
   */
  deleteChat(chatId: string): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/chats/${chatId}`, { withCredentials: true });
  }

  /**
   * Sets up listeners for chat-related events.
   * Listens for events such as participants changing, chat deletion, and being added or removed from chats.
   * @returns void
   */
  listenForChatEvents() {
    if (this.chatEventsBound) return;
    this.chatEventsBound = true;

    this.socketService.on<{ chatId: string }>('participants_changed').subscribe(({ chatId }) => {
      this.zone.run(() => {
        if (this.activeChat()?.id === chatId) {
          this.loadParticipants(chatId);
        }
        this.refreshChatCount(chatId);
      });
    });

    this.socketService.on<{ chatId: string }>('chat_deleted').subscribe(({ chatId }) => {
      this.zone.run(() => {
        this.chats.update((c) => c.filter((chat) => chat.id !== chatId));
        if (this.activeChat()?.id === chatId) this.closeActiveChat();
      });
    });

    this.socketService.on<{ chatId: string }>('removed_from_chat').subscribe(({ chatId }) => {
      this.zone.run(() => {
        this.chats.update((current) =>
          current.flatMap((chat) => {
            if (chat.id !== chatId) return [chat];
            if (chat.type === 'PRIVATE_GROUP') return [];
            return [
              {
                ...chat,
                isMember: false,
                participantCount: Math.max(0, chat.participantCount - 1),
              },
            ];
          }),
        );
        if (this.activeChat()?.id === chatId) this.closeActiveChat();
      });
    });

    this.socketService.on<{ chatId: string }>('added_to_chat').subscribe(() => {
      this.zone.run(() => this.loadChats());
    });
  }

  /**
   * Closes the currently active chat, clearing its messages and participants.
   *
   * @returns void
   */
  closeActiveChat() {
  const chatId = this.activeChat()?.id;
  if (chatId) {
    this.socketService.emit('leave_chat', chatId);
  }
  this.activeChat.set(null);
  this.messages.set([]);
  this.participants.set([]);
}

  /**
   * Joins a specified chat.
   *
   * @param chatId The ID of the chat to join.
   * @param password The password for the chat, if required.
   * @returns An Observable indicating the success or failure of the operation.
   */
  joinChat(chatId: string, password?: string): Observable<unknown> {
    return this.http
      .post(`${this.apiUrl}/chats/${chatId}/join`, { password }, { withCredentials: true })
      .pipe(
        tap(() => {
          this.chats.update((current) =>
            current.map((c) =>
              c.id === chatId
                ? { ...c, isMember: true, participantCount: c.participantCount + 1 }
                : c,
            ),
          );
        }),
      );
  }
}
