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

@Service()
export class UserService {
  private http = inject(HttpClient);
  private socketService = inject(SocketService);
  private zone = inject(NgZone);
  private apiUrl = environment.apiUrl;

  readonly users = signal<User[]>([]);
  readonly loading = signal(false);

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