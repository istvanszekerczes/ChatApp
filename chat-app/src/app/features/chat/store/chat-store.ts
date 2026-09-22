import { inject, computed } from '@angular/core';
import {
  signalStore,
  withMethods,
  withState,
  patchState,
  withComputed,
  withProps,
} from '@ngrx/signals';
import { Observable, map, tap, pipe } from 'rxjs';
import { Chat } from '../models/chat';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { BackendCommunicator } from '../../../core/services/backend-communicator';
import { SocketService } from '../../../core/services/socket-service';
import { withDevtools } from '@angular-architects/ngrx-toolkit';

type ChatState = {
  activeChatId: string;
  chats: Chat[];
  chatsLoading: boolean;
};

const initialState: ChatState = {
  activeChatId: '',
  chats: [],
  chatsLoading: false,
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
      patchState(store, (state) => ({
        chats: state.chats.map((chat) =>
          chat.id === chatId ? { ...chat, messagesLoading: true } : chat,
        ),
      }));
      backendCommunicator
        .loadMessages(chatId)
        .pipe(map((r) => r.messages))
        .subscribe({
          next: (messages) => {
            if (store.activeChatId() !== chatId) return;
            patchState(store, (state) => ({
              chats: state.chats.map((chat) =>
                chat.id === chatId ? { ...chat, messages, messagesLoading: false } : chat,
              ),
            }));
          },
          error: (err) => {
            console.log('Failed to load messages', err);
            if (store.activeChatId() !== chatId) return;
            patchState(store, (state) => ({
              chats: state.chats.map((chat) =>
                chat.id === chatId ? { ...chat, messagesLoading: false } : chat,
              ),
            }));
          },
        });
    },

    loadParticipants(chatId: string) {
      patchState(store, (state) => ({
        chats: state.chats.map((chat) =>
          chat.id === chatId ? { ...chat, particapantsLoading: true } : chat,
        ),
      }));
      backendCommunicator
        .loadParticipants(chatId)
        .pipe(map((r) => r.participants))
        .subscribe({
          next: (participants) => {
            if (store.activeChatId() !== chatId) return;
            patchState(store, (state) => ({
              chats: state.chats.map((chat) =>
                chat.id === chatId ? { ...chat, participants, particapantsLoading: false } : chat,
              ),
            }));
          },
          error: (err) => {
            console.log('Failed to load participants', err);
            patchState(store, (state) => ({
              chats: state.chats.map((chat) =>
                chat.id === chatId ? { ...chat, particapantsLoading: false } : chat,
              ),
            }));
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
        patchState(store, (state) => ({
          chats: state.chats.map((chat) => ({
            ...chat,
            messages: chat.messages.map((msg) =>
              msg.userId === user.id
                ? { ...msg, user: { ...msg.user, avatarColor: user.avatarColor } }
                : msg,
            ),
            participants: chat.participants.map((p) =>
              p.id === user.id
                ? { ...p, avatarColor: user.avatarColor, username: user.username }
                : p,
            ),
          })),
        }));
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
        patchState(store, (state) => ({
          chats: state.chats.map((chat) =>
            chat.id === msg.chatId
              ? {
                  ...chat,
                  messages: chat.messages.some((m) => m.id === msg.id)
                    ? chat.messages
                    : [...chat.messages, msg],
                }
              : chat,
          ),
        }));
      });
    },
  })),
);
