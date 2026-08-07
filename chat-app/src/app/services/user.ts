import { Service, NgZone, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { User } from '../models/user';
import { SocketService } from './socket';
import { environment } from '../environments/environment';

interface PresenceEvent {
  userId: string;
  online: boolean;
  lastOnline: string | null;
}

interface UserUpdatedEvent {
  id: string;
  username: string;
  avatarColor: string | null;
}

interface NewUserEvent {
  id: string;
  username: string;
  avatarColor: string | null;
  online: boolean;
  lastOnline: string | null;
}

@Service()
export class UserService {
  private http = inject(HttpClient);
  private socketService = inject(SocketService);
  private zone = inject(NgZone);
  private apiUrl = environment.apiUrl;

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
    this.http
      .get<{ users: User[] }>(`${this.apiUrl}/users`, { withCredentials: true })
      .pipe(map(r => r.users))
      .subscribe({
        next: users => {
          this.users.set(users);
          this.loading.set(false);
        },
        error: err => {
          console.error('Failed to load users', err);
          this.loading.set(false);
        },
      });
  }

  listenForUserUpdates() {
    if (this.userUpdateListenerBound) return;
    this.userUpdateListenerBound = true;

    this.socketService.on<UserUpdatedEvent>('user_updated').subscribe(event => {
      this.zone.run(() => {
        this.users.update(current =>
          current.map(u =>
            u.id === event.id
              ? { ...u, username: event.username, avatarColor: event.avatarColor }
              : u
          )
        );
      });
    });
  }

  listenForNewUsers() {
  if (this.newUserListenerBound) return;
  this.newUserListenerBound = true;

  this.socketService.on<NewUserEvent>('user_registered').subscribe(newUser => {
    this.zone.run(() => {
      this.users.update(current =>
        current.some(u => u.id === newUser.id)
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
            ].sort((a, b) => a.username.localeCompare(b.username))
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

    this.socketService.on<PresenceEvent>('presence_changed').subscribe(event => {
      this.zone.run(() => {
        this.users.update(current =>
          current.map(u =>
            u.id === event.userId
              ? { ...u, online: event.online, lastOnline: event.lastOnline ?? u.lastOnline }
              : u
          )
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