import { inject, computed } from '@angular/core';
import {
  signalStore,
  withMethods,
  withState,
  patchState,
  withComputed,
  withProps,
} from '@ngrx/signals';
import { Observable, map, tap, pipe, switchMap, toArray } from 'rxjs';
import { Chat } from '../models/chat';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { BackendCommunicator } from '../../../core/services/backend-communicator';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { tapResponse } from '@ngrx/operators';

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
  })),
  //withMetohds for the core functions of the store.
  withMethods(({ backendCommunicator, ...store }) => ({
    selectChat(chat: Chat) {
      patchState(store, { activeChatId: chat.id });
    },

    loadChats: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { chatsLoading: true })),
        switchMap(() =>
          backendCommunicator.loadChats().pipe(
            tapResponse({
              next: (res) => patchState(store, { chats: res.chats, chatsLoading: false }),
              error: () => patchState(store, { chatsLoading: false }),
            }),
          ),
        ),
      ),
    ),

    loadMessages: rxMethod<string>(
      pipe(
        tap((chatId) =>
          patchState(store, (state) => ({
            chats: state.chats.map((chat) =>
              chat.id === chatId ? { ...chat, messagesLoading: true } : chat,
            ),
          })),
        ),
        switchMap((chatId) =>
          backendCommunicator.loadMessages(chatId).pipe(
            tapResponse({
              next: (res) => {
                if (store.activeChatId() !== chatId) return;
                patchState(store, (state) => ({
                  chats: state.chats.map((chat) =>
                    chat.id === chatId
                      ? { ...chat, messages: res.messages, messagesLoading: false }
                      : chat,
                  ),
                }));
              },
              error: () => {
                if (store.activeChatId() !== chatId) return;
                patchState(store, (state) => ({
                  chats: state.chats.map((chat) =>
                    chat.id === chatId ? { ...chat, messagesLoading: false } : chat,
                  ),
                }));
              },
            }),
          ),
        ),
      ),
    ),

    loadParticipants: rxMethod<string>(
      pipe(
        tap((chatId) =>
          patchState(store, (state) => ({
            chats: state.chats.map((chat) =>
              chat.id === chatId ? { ...chat, messagesLoading: true } : chat,
            ),
          })),
        ),
        switchMap((chatId) =>
          backendCommunicator.loadParticipants(chatId).pipe(
            tapResponse({
              next: (res) => {
                if (store.activeChatId() !== chatId) return;
                patchState(store, (state) => ({
                  chats: state.chats.map((chat) =>
                    chat.id === chatId
                      ? { ...chat, participants: res.participants, participantsLoading: false }
                      : chat,
                  ),
                }));
              },
              error: () => {
                if (store.activeChatId() !== chatId) return;
                patchState(store, (state) => ({
                  chats: state.chats.map((chat) =>
                    chat.id === chatId ? { ...chat, participantsLoading: false } : chat,
                  ),
                }));
              },
            }),
          ),
        ),
      ),
    ),

    refreshChatCount: rxMethod<string>(
      pipe(
        switchMap((chatId) =>
          backendCommunicator.refreshChatCount(chatId).pipe(
            map((r) => ({ chatId, updated: r.chats.find((c) => c.id === chatId) })),
            tapResponse({
              next: ({ chatId, updated }) => {
                if (!updated) return;

                patchState(store, (state) => ({
                  chats: state.chats.map((c) => (c.id === chatId ? updated : c)),
                }));

                if (store.activeChatId() === chatId) {
                  patchState(store, { activeChatId: chatId });
                }
              },
              error: () => {},
            }),
          ),
        ),
      ),
    ),

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
        backendCommunicator.leaveChat(chatId);
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
  })),

  //withMetohds for listeners that are using the store's other functions.
  withMethods(({ backendCommunicator, ...store }) => ({
    listenForChatDeleted: rxMethod<void>(
      pipe(
        switchMap(() =>
          backendCommunicator.listenForChatDeleted().pipe(
            tap(({ chatId }) => {
              patchState(store, (state) => ({
                chats: state.chats.filter((chat) => chat.id !== chatId),
              }));
              store.closeActiveChat();
            }),
          ),
        ),
      ),
    ),

    listenForUserUpdates: rxMethod<void>(
      pipe(
        switchMap(() =>
          backendCommunicator.listenForUserUpdates().pipe(
            tap((user) => {
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
            }),
          ),
        ),
      ),
    ),

    listenForParticipantsChanged: rxMethod<void>(
      pipe(
        switchMap(() =>
          backendCommunicator.listenForParticipantsChanged().pipe(
            tap(({ chatId }) => {
              if (store.activeChatId() === chatId) {
                store.loadParticipants(chatId);
              }
              store.refreshChatCount(chatId);
            }),
          ),
        ),
      ),
    ),

    listenForRemovedFromChat: rxMethod<void>(
      pipe(
        switchMap(() =>
          backendCommunicator.listenForRemovedFromChat().pipe(
            tap(({ chatId }) => {
              patchState(store, (state) => ({
                chats: state.chats.flatMap((chat) => {
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
              }));
              if (store.activeChatId() === chatId) {
                store.closeActiveChat();
              }
            }),
          ),
        ),
      ),
    ),

    listenForAddedToChat: rxMethod<void>(
      pipe(
        switchMap(() =>
          backendCommunicator.listenForAddedToChat().pipe(
            tap(() => {
              store.loadChats();
            }),
          ),
        ),
      ),
    ),

    listenForNewChats: rxMethod<Chat>(
      pipe(
        switchMap(() =>
          backendCommunicator.listenForNewChats().pipe(
            tap((newChat) => {
              console.log('[socket] chat_created', newChat);
              store.upsert(newChat);
            }),
          ),
        ),
      ),
    ),

    listenForMessages: rxMethod<void>(
      pipe(
        switchMap(() =>
          backendCommunicator.listenForMessages().pipe(
            tap((msg) => {
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
            }),
          ),
        ),
      ),
    ),
  })),
);
