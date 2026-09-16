import { inject } from '@angular/core';
import { signalStore, withMethods, withState, patchState } from '@ngrx/signals';
import { firstValueFrom, map } from 'rxjs';
import { Chat } from '../../features/chat/models/chat';
import { User } from '../../features/users/models/user';
import { Message } from '../../features/chat/models/message';
import { BackendCommunicator } from '../services/backend-communicator';

type ChatState = {
  chats: Chat[];
  users: User[];
  messages: Message[];
  participants: User[];
  isLoading: boolean;
};

const initialState: ChatState = {
  chats: [],
  users: [],
  messages: [],
  participants: [],
  isLoading: false,
};

export const ChatStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, backendCommunicator = inject(BackendCommunicator)) => ({
    async loadChats(): Promise<void> {
      backendCommunicator
        .loadChats()
        .pipe(map((r) => r.chats))
        .subscribe({
          next: (chats) => patchState(store, { chats, isLoading: false }),
          error: (err) => {
            console.error('Failed to load chats', err);
            patchState(store, { isLoading: false });
          },
        });
    },

    async loadMessages(chatId: string): Promise<void> {
      backendCommunicator
        .loadMessages(chatId)
        .pipe(map((r) => r.messages))
        .subscribe({
          next: (messages) => patchState(store, { messages, isLoading: false }),
          error: (err) => {
            console.log('Failed to load messages', err);
            patchState(store, { isLoading: false });
          },
        });
    },

    async clearChats(): Promise<void> {
      
    },

    async loadUsers(): Promise<void> {
      patchState(store, { isLoading: true });
      const { users } = await firstValueFrom(backendCommunicator.loadUsers());
      patchState(store, { users, isLoading: false });
    },

    async loadParticipants(chatId: string): Promise<void> {
      patchState(store, { isLoading: true });
      const { participants } = await firstValueFrom(backendCommunicator.loadParticipants(chatId));
      patchState(store, { participants, isLoading: false });
    },
    
  })),
);
