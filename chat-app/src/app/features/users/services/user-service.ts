import { Service, NgZone, inject, signal } from '@angular/core';
import { map } from 'rxjs';
import { User } from '../models/user';
import { BackendCommunicator } from '../../../core/services/backend-communicator';

@Service()
export class UserService {
  private zone = inject(NgZone);
  private backendCommunicator = inject(BackendCommunicator);
  readonly users = signal<User[]>([]);
  readonly loading = signal(false);

  private userUpdateListenerBound = false;
  private newUserListenerBound = false;

  private listening = false;

  /**
   * Loads the list of users from the server and updates the `users` signal.
   */
  loadUsers() {
    this.loading.set(true);
    this.backendCommunicator
      .loadUsers()
      .pipe(map((r) => r.users))
      .subscribe({
        next: (users) => {
          this.users.set(users);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load users', err);
          this.loading.set(false);
        },
      });
  }

  listenForUserUpdates() {
    if (this.userUpdateListenerBound) return;
    this.userUpdateListenerBound = true;

    this.backendCommunicator.listenForUserUpdates().subscribe((event) => {
      this.zone.run(() => {
        this.users.update((current) =>
          current.map((u) =>
            u.id === event.id
              ? { ...u, username: event.username, avatarColor: event.avatarColor }
              : u,
          ),
        );
      });
    });
  }

  listenForNewUsers() {
    if (this.newUserListenerBound) return;
    this.newUserListenerBound = true;

    this.backendCommunicator.listenForNewUsers().subscribe((newUser) => {
      this.zone.run(() => {
        this.users.update((current) =>
          current.some((u) => u.id === newUser.id)
            ? current
            : [
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
        );
      });
    });
  }

  /**
   * Listens for presence changes and updates the user list accordingly.
   */
  listenForPresence() {
    if (this.listening) return;
    this.listening = true;

    this.backendCommunicator.listenForPresence().subscribe((event) => {
      this.zone.run(() => {
        this.users.update((current) =>
          current.map((u) =>
            u.id === event.userId
              ? { ...u, online: event.online, lastOnline: event.lastOnline ?? u.lastOnline }
              : u,
          ),
        );
      });
    });
  }

  /**
   * Clears the list of users, resetting the `users` signal to an empty array.
   */
  clearUsers() {
    this.users.set([]);
  }
}
