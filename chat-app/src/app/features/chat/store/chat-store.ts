import { inject } from '@angular/core';
import { signalStore, withMethods, withState, patchState } from '@ngrx/signals';
import { Observable, map, tap } from 'rxjs';
import { Chat } from '../models/chat';
import { User } from '../../users/models/user';
import { Message } from '../models/message';
import { BackendCommunicator } from '../../../core/services/backend-communicator';
import { SocketService } from '../../../core/services/socket-service';

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
  withMethods((store, backendCommunicator = inject(BackendCommunicator)) => ({
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
      patchState(store, initialState);
    },

    joinChat(chatId: string, password?: string): Observable<unknown> {
    return backendCommunicator.joinChat(chatId, password).pipe(
      tap(() => {
        patchState(store, {
          chats: store.chats().map((c) =>
            c.id === chatId
              ? { ...c, isMember: true, participantCount: c.participantCount + 1 }
              : c,
          ),
        });
      }),
    );
  },
  //TODO:
  listenForChatDelete() {},
  listenForRemovedFromChat() {},
  listenForNewChats() {},
  listenForMessages() {},
  })),
);
