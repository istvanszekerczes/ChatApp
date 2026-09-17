import { Service, NgZone, inject, signal, computed } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { Chat, CreateChatPayload } from '../models/chat';
import { User } from '../../users/models/user';
import { SocketService } from '../../../core/services/socket-service';
import { BackendCommunicator } from '../../../core/services/backend-communicator';
import { Router } from '@angular/router';
import { JoinChatDialog } from '../components/join-chat-dialog/join-chat-dialog';
import { MatDialog } from '@angular/material/dialog';
import { ChatStore } from '../store/chat-store';

@Service()
export class ChatService {
  private socketService = inject(SocketService);
  private zone = inject(NgZone);
  readonly chats = computed(() => this.store.chats());
  readonly loading = computed(() => this.store.chatsLoading());
  private userListenerBound = false;
  private backendCommunicator = inject(BackendCommunicator);
  private dialog = inject(MatDialog);

  private listening = false;

  readonly activeChatId = computed(() => this.store.activeChatId());
  readonly messages = computed(() => this.store.messages());
  readonly messagesLoading = computed(() => this.store.messagesLoading());

  private messageListenerBound = false;
  readonly participants = computed(() => this.store.participants());
  readonly participantsLoading = computed(() => this.store.messagesLoading());

  private chatEventsBound = false;
  private router = inject(Router);

  private pendingDirectChats = new Set<string>();
  private store = inject(ChatStore);
  /**
   * Selects a chat to view its messages and participants.
   *
   * @param chat The chat to select.
   * @returns void
   * If the chat is already selected, it does nothing.
   * If a different chat is selected, it leaves the previous chat and joins the new one.
   */
  selectChat(chat: Chat) {
    if (this.activeChatId() === chat.id) return;

    if (chat.type === 'PROTECTED_GROUP' && !chat.isMember) {
      this.dialog
        .open(JoinChatDialog, {
          panelClass: 'chat-dialog-panel',
          data: chat,
        })
        .afterClosed()
        .subscribe((joined) => {
          if (!joined) return;

          const updated = this.chats().find((c) => c.id === chat.id);
          if (updated) {
            this.enterChat(updated);
          }
        });
      return;
    }

    this.enterChat(chat);
  }

  private enterChat(chat: Chat) {
    const previousChatId = this.activeChatId();
    if (previousChatId) {
      this.socketService.emit('leave_chat', previousChatId);
    }

    this.store.selectChat(chat);
    this.store.loadMessages(chat.id);
    this.store.loadParticipants(chat.id);

    this.listenForMessages();
    this.socketService.emit('join_chat', chat.id);
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
    const chat = this.backendCommunicator.getChat(this.activeChatId());
    if (!chat || !content.trim()) return;
    this.backendCommunicator.sendMessage(this.activeChatId(), content.trim());
  }

  /**
   * Listens for incoming messages in the currently selected chat.
   *
   * @returns void
   */
  private listenForMessages() {
    if (this.messageListenerBound) return;
    this.messageListenerBound = true;
  }

  /**
   * Refreshes the message count for the specified chat.
   *
   * @param chatId The ID of the chat for which to refresh the count.
   * @returns void
   */

  /**
   * Listens for new chats created by other users.
   *
   * @returns void
   */
  listenForNewChats() {
    if (this.listening) return;
    this.listening = true;

    this.backendCommunicator.listenForNewChats().subscribe((chat) => {
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

    this.store.listenForUserUpdates();
  }

  /**
   * Loads the list of chats for the current user.
   *
   * @returns void
   */
  loadChats() {
    this.store.loadChats();
  }

  getChat(chatId: string): Observable<Chat> {
    return this.backendCommunicator.getChat(chatId).pipe(map((r) => r.chat));
  }

  /**
   * Clears the list of chats and resets the active chat and messages.
   *
   * @returns void
   */
  clearChats() {
    this.store.clearChats();
  }

  /**
   * Loads the list of all users.
   *
   * @returns An Observable of the list of users.
   */
  getAllUsers(): Observable<User[]> {
    return this.backendCommunicator.getAllUsers().pipe(map((r) => r.users));
  }

  /**
   * Creates a new chat with the provided payload.
   *
   * @param payload The data for the new chat.
   * @returns An Observable of the created chat.
   */
  createChat(payload: CreateChatPayload): Observable<Chat> {
    return this.backendCommunicator.createChat(payload).pipe(
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
    return this.backendCommunicator.createDirectChat(targetId).pipe(
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
      this.router.navigate(['/chat', existing.id]);
      return;
    }

    if (this.pendingDirectChats.has(targetId)) return;
    this.pendingDirectChats.add(targetId);

    this.createDirectChat(targetId).subscribe({
      next: (chat) => {
        this.pendingDirectChats.delete(targetId);
        this.router.navigate(['/chat', chat.id]);
      },
      error: (err) => {
        this.pendingDirectChats.delete(targetId);
        console.error('Failed to open conversation', err);
      },
    });
  }

  /**
   * Updates or inserts a chat into the list of chats.
   *
   * @param chat The chat to update or insert.
   * @returns void
   */
  private upsert(chat: Chat) {
    this.store.upsert(chat);
  }

  /**
   * Loads the participants of a specified chat.
   *
   * @param chatId The ID of the chat for which to load participants.
   * @returns void
   */
  loadParticipants(chatId: string) {
    this.store.loadParticipants(chatId);
  }

  /**
   * Adds participants to a specified chat.
   *
   * @param chatId The ID of the chat to which to add participants.
   * @param userIds The IDs of the users to add.
   * @returns An Observable of the updated list of participants.
   */
  addParticipants(chatId: string, userIds: string[]): Observable<User[]> {
    return this.backendCommunicator.addParticpants(chatId, userIds).pipe(map((r) => r.added));
  }

  /**
   * Removes a participant from a specified chat.
   *
   * @param chatId The ID of the chat from which to remove the participant.
   * @param userId The ID of the user to remove.
   * @returns An Observable indicating the success or failure of the operation.
   */
  removeParticipant(chatId: string, userId: string): Observable<unknown> {
    return this.backendCommunicator.removeParticipants(chatId, userId);
  }

  /**
   * Deletes a specified chat.
   *
   * @param chatId The ID of the chat to delete.
   * @returns An Observable indicating the success or failure of the operation.
   */
  deleteChat(chatId: string): Observable<unknown> {
    return this.backendCommunicator.deleteChat(chatId);
  }

  /**
   * Sets up listeners for chat-related events.
   * Listens for events such as participants changing, chat deletion, and being added or removed from chats.
   * @returns void
   */
  listenForChatEvents() {
    if (this.chatEventsBound) return;
    this.chatEventsBound = true;

    this.backendCommunicator.listenForParticipantsChanged().subscribe(({ chatId }) => {
      this.zone.run(() => {
        if (this.activeChatId() === chatId) {
          this.store.loadParticipants(chatId);
        }
        this.store.refreshChatCount(chatId);
      });
    });

    this.backendCommunicator.listenForChatDeleted().subscribe(({ chatId }) => {
      this.zone.run(() => {
        this.chats.update((c) => c.filter((chat) => chat.id !== chatId));
        if (this.activeChatId()?.id === chatId) this.closeActiveChat();
      });
    });

    this.backendCommunicator.listenForRemovedFromChat().subscribe(({ chatId }) => {
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
        if (this.activeChatId()?.id === chatId) this.closeActiveChat();
      });
    });

    this.backendCommunicator.listenForAddedToChat().subscribe(() => {
      this.zone.run(() => this.loadChats());
    });
  }

  /**
   * Closes the currently active chat, clearing its messages and participants.
   *
   * @returns void
   */
  closeActiveChat() {
    const chatId = this.activeChatId();
    if (chatId !== '') {
      this.socketService.emit('leave_chat', chatId);
    }
    this.store.closeActiveChat();
  }

  /**
   * Joins a specified chat.
   *
   * @param chatId The ID of the chat to join.
   * @param password The password for the chat, if required.
   * @returns An Observable indicating the success or failure of the operation.
   */
  joinChat(chatId: string, password?: string): Observable<unknown> {
    return this.store.joinChat(chatId, password);
  }
}
