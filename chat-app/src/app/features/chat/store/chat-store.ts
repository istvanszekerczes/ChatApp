import { inject, computed } from '@angular/core';
import {
  signalStore,
  withMethods,
  withState,
  patchState,
  withComputed,
  withProps,
} from '@ngrx/signals';
import { Observable, map, tap } from 'rxjs';
import { Chat } from '../models/chat';
import { User } from '../../users/models/user';
import { Message } from '../models/message';
import { BackendCommunicator } from '../../../core/services/backend-communicator';
import { SocketService } from '../../../core/services/socket-service';
import { withDevtools } from '@angular-architects/ngrx-toolkit';

type ChatState = {
  activeChatId: string;
  chats: Chat[];
  messages: Message[];
  participants: User[];
  chatsLoading: boolean;
  messagesLoading: boolean;
  participantsLoading: boolean;
};

const initialState: ChatState = {
  activeChatId: '',
  chats: [],
  messages: [],
  participants: [],
  chatsLoading: false,
  messagesLoading: false,
  participantsLoading: false,
};

export const ChatStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withDevtools('chat'),
  withComputed((store) => ({
    activeChat: computed(() => store.chats().find((c) => c.id === store.activeChatId())),
  })),
  withProps(() => ({
    backendCommunicator: inject(BackendCommunicator),
    socketService: inject(SocketService),
  })),

  withMethods(({ backendCommunicator, socketService, ...store }) => ({
    selectChat(chat: Chat) {
      patchState(store, { activeChatId: chat.id });
    },

    loadChats() {
      patchState(store, { chatsLoading: true });
      backendCommunicator
        .loadChats()
        .pipe(map((r) => r.chats))
        .subscribe({
          next: (chats) => patchState(store, { chats, chatsLoading: false }),
          error: () => patchState(store, { chatsLoading: false }),
        });
    },

    loadMessages(chatId: string) {
      patchState(store, { messagesLoading: true });
      backendCommunicator
        .loadMessages(chatId)
        .pipe(map((r) => r.messages))
        .subscribe({
          next: (messages) => {
            if (store.activeChatId() !== chatId) return;
            patchState(store, { messages, messagesLoading: false });
          },
          error: (err) => {
            console.log('Failed to load messages', err);
            if (store.activeChatId() !== chatId) return;
            patchState(store, { messagesLoading: false });
          },
        });
    },

    loadParticipants(chatId: string) {
      patchState(store, { participantsLoading: true });
      backendCommunicator
        .loadParticipants(chatId)
        .pipe(map((r) => r.participants))
        .subscribe({
          next: (participants) => {
            if (store.activeChatId() !== chatId) return;
            patchState(store, { participants, participantsLoading: false });
          },
          error: (err) => {
            console.log('Failed to load participants', err);
            patchState(store, { participantsLoading: false });
          },
        });
    },

    refreshChatCount(chatId: string) {
      backendCommunicator
        .refreshChatCount(chatId)
        .pipe(map((r) => r.chats.find((c) => c.id === chatId)))
        .subscribe((updated) => {
          if (!updated) return;

          patchState(store, {
            chats: store.chats().map((c) => (c.id === chatId ? updated : c)),
          });

          if (store.activeChatId() === chatId) {
            patchState(store, { activeChatId: chatId });
          }
        });
    },

    upsert(chat: Chat) {
      const current = store.chats();
      const exists = current.some((c) => c.id === chat.id);
      if (exists) return;

      patchState(store, { chats: [chat, ...current] });
    },

    clearChats() {
      patchState(store, initialState);
    },

    closeActiveChat() {
      const chatId = store.activeChatId();
      if (chatId !== '') {
        socketService.emit('leave_chat', chatId);
      }
      patchState(store, {
        activeChatId: '',
        messages: [],
        participants: [],
        messagesLoading: false,
        participantsLoading: false,
      });
    },

    joinChat(chatId: string, password?: string): Observable<unknown> {
      return backendCommunicator.joinChat(chatId, password).pipe(
        tap(() => {
          patchState(store, {
            chats: store
              .chats()
              .map((c) =>
                c.id === chatId
                  ? { ...c, isMember: true, participantCount: c.participantCount + 1 }
                  : c,
              ),
          });
        }),
      );
    },

    listenForUserUpdates() {
      backendCommunicator.listenForUserUpdates().subscribe((user) => {
        patchState(store, {
          messages: store
            .messages()
            .map((msg) =>
              msg.userId === user.id
                ? { ...msg, user: { ...msg.user, avatarColor: user.avatarColor } }
                : msg,
            ),
          participants: store
            .participants()
            .map((p) =>
              p.id === user.id
                ? { ...p, avatarColor: user.avatarColor, username: user.username }
                : p,
            ),
        });
      });
    },

    listenForChatDeleted() {
      return backendCommunicator.listenForChatDeleted().subscribe(({ chatId }) => {
        patchState(store, { chats: store.chats().filter((chat) => chat.id !== chatId) });
        if (store.activeChatId() === chatId) this.closeActiveChat();
      });
    },

    listenForParticipantsChanged() {
      backendCommunicator.listenForParticipantsChanged().subscribe(({ chatId }) => {
        if (store.activeChatId() === chatId) {
          this.loadParticipants(chatId);
        }
        this.refreshChatCount(chatId);
      });
    },

    listenForRemovedFromChat() {
      return backendCommunicator.listenForRemovedFromChat().subscribe(({ chatId }) => {
        patchState(store, {
          chats: store.chats().flatMap((chat) => {
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
        });
        if (store.activeChatId() === chatId) {
          this.closeActiveChat();
        }
      });
    },

    listenForAddedToChat() {
      backendCommunicator.listenForAddedToChat().subscribe(() => {
        this.loadChats();
      });
    },

    listenForNewChats() {
      backendCommunicator.listenForNewChats().subscribe((chat) => {
        console.log('[socket] chat_created', chat);
        this.upsert(chat);
      });
    },

    listenForMessages() {
      return backendCommunicator.listenForMessages().subscribe((msg) => {
        if (msg.chatId !== store.activeChatId()) return;
        patchState(store, {
          messages: store.messages().some((m) => m.id === msg.id)
            ? store.messages()
            : [...store.messages(), msg],
        });
      });
    },
  })),
);
