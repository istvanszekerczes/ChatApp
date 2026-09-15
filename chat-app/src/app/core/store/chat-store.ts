import { inject } from '@angular/core';
import { signalStore, withMethods, withState, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
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
      patchState(store, { isLoading: true });
      const { chats } = await firstValueFrom(backendCommunicator.loadChats());
      patchState(store, { chats, isLoading: false });
    },

    async loadUsers(): Promise<void> {
      patchState(store, { isLoading: true });
      const { users } = await firstValueFrom(backendCommunicator.loadUsers());
      patchState(store, { users, isLoading: false });
    },

    async loadMessages(chatId: string): Promise<void> {
      patchState(store, { isLoading: true });
      const { messages } = await firstValueFrom(backendCommunicator.loadMessages(chatId));
      patchState(store, { messages, isLoading: false });
    },

    async loadParticipants(chatId: string): Promise<void> {
      patchState(store, { isLoading: true });
      const { participants } = await firstValueFrom(backendCommunicator.loadParticipants(chatId));
      patchState(store, { participants, isLoading: false });
    },
  })),
);
