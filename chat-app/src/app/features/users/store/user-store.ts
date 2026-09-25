import { inject } from '@angular/core';
import { signalStore, withMethods, withState, patchState, withProps } from '@ngrx/signals';
import { User } from '../../users/models/user';
import { BackendCommunicator } from '../../../core/services/backend-communicator';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { map, tap, of, catchError, Observable, pipe, switchMap } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';

type UserState = {
  currentUser: User | null;
  users: User[];
  usersLoading: boolean;
};

const initialState: UserState = {
  currentUser: null,
  users: [],
  usersLoading: false,
};

export const UserStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withDevtools('users'),
  withProps(() => ({
    backendCommunicator: inject(BackendCommunicator),
  })),
  withMethods(({ backendCommunicator, ...store }) => ({
    loadUsers: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { usersLoading: true })),
        switchMap(() =>
          backendCommunicator.loadUsers().pipe(
            tapResponse({
              next: (res) => patchState(store, { users: res.users, usersLoading: false }),
              error: () => patchState(store, { usersLoading: false }),
            }),
          ),
        ),
      ),
    ),

    clearUsers() {
      patchState(store, initialState);
    },

    saveLoggedInUser(user: User) {
      patchState(store, { currentUser: user });
    },

    resetUser() {
      patchState(store, { currentUser: null });
    },

    loadCurrentUser(): Observable<User | null> {
      return backendCommunicator.loadCurrentUser().pipe(
        map((response) => response.user),
        tap((user) => patchState(store, { currentUser: user })),
        catchError(() => {
          patchState(store, { currentUser: null });
          return of(null);
        }),
      );
    },

    /*
    loadCurrentUser: rxMethod<void>(
      pipe(
        switchMap(() =>
          backendCommunicator.loadCurrentUser().pipe(
            tapResponse({
              next: (res) => patchState(store, { currentUser: res.user }),
              error: () => patchState(store, { currentUser: null}),
            }),
          ),
        ),
      ),
    ),*/

    updateAvatarColor(avatarColor: string): Observable<User> {
      return backendCommunicator.updateAvatarColor(avatarColor).pipe(
        map((response) => response.user),
        tap((user) => patchState(store, { currentUser: user })),
      );
    },
  })),

  withMethods(({ backendCommunicator, ...store }) => ({
    listenForUserUpdates: rxMethod<void>(
      pipe(
        switchMap(() =>
          backendCommunicator.listenForUserUpdates().pipe(
            tap((user) => {
              patchState(store, {
                users: store
                  .users()
                  .map((p) =>
                    p.id === user.id
                      ? { ...p, avatarColor: user.avatarColor, username: user.username }
                      : p,
                  ),
              });
            }),
          ),
        ),
      ),
    ),

    listenForNewUser: rxMethod<void>(
      pipe(
        switchMap(() =>
          backendCommunicator.listenForNewUsers().pipe(
            tap((newUser) => {
              const current = store.users();
              if (current.some((u) => u.id === newUser.id)) return;

              patchState(store, {
                users: [
                  ...current,
                  {
                    id: newUser.id,
                    username: newUser.username,
                    avatarColor: newUser.avatarColor,
                    online: newUser.online,
                    lastOnline: newUser.lastOnline,
                    email: '',
                    createdAt: '',
                    googleId: null,
                    facebookId: null,
                  },
                ].sort((a, b) => a.username.localeCompare(b.username)),
              });
            }),
          ),
        ),
      ),
    ),

    listenForPresence() {
      return backendCommunicator.listenForPresence().subscribe((event) => {
        patchState(store, {
          users: store
            .users()
            .map((u) =>
              u.id === event.userId
                ? { ...u, online: event.online, lastOnline: event.lastOnline ?? u.lastOnline }
                : u,
            ),
        });
      });
    },
  })),
);
