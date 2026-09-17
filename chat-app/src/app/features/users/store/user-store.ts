import { inject } from '@angular/core';
import { signalStore, withMethods, withState, patchState } from '@ngrx/signals';
import { User } from '../../users/models/user';
import { BackendCommunicator } from '../../../core/services/backend-communicator';

type UserState = {
  currentUserId: string;
  users: User[];
  usersLoading: boolean;
};

const initialState: UserState = {
  currentUserId: '',
  users: [],
  usersLoading: false,
};

export const UserStore = signalStore({ providedIn: 'root' }, withState(initialState));
