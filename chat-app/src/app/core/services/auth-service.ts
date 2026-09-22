import { Service, computed, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { User } from '../../features/users/models/user';
import { BackendCommunicator } from './backend-communicator';
import { UserStore } from '../../features/users/store/user-store';
import { toObservable } from '@angular/core/rxjs-interop';

@Service()
export class AuthService {
  private store = inject(UserStore);
  private backendCommunicator = inject(BackendCommunicator);
  private currentUser = computed(() => this.store.currentUser());
  readonly currentUser$ = toObservable(this.currentUser);

  readonly avatarColors = ['#3b82f6', '#ef4444', '#22c55e', '#a855f7', '#f59e0b', '#ec4899'];

  /**
   * Registers a new user with the provided email, username, and password.
   *
   * @param userData Object containing email, username, and password.
   * @returns An Observable of the server's response containing a message and the new user's ID.
   */
  register(userData: { email: string; username: string; password: string }) {
    return this.backendCommunicator.register(userData);
  }

  /**
   * Authenticates the user and stores them in currentUserSubject so the rest
   * of the app reacts to the login.
   *
   * @param credentials Email and password
   * @returns The logged-in user, wrapped in the server's response envelope
   */
  login(credentials: { email: string; password: string }) {
    return this.backendCommunicator
      .login(credentials)
      .pipe(tap((response) => this.store.saveLoggedInUser(response.user)));
  }

  /**
   * Logs the user out and clears their session.
   *
   * @returns An Observable indicating the success or failure of the logout operation.
   */
  logout(): Observable<unknown> {
    return this.backendCommunicator.logout().pipe(tap(() => this.store.resetUser()));
  }

  /**
   * Loads the current user from the server and updates the currentUserSubject.
   *
   * @returns An Observable of the current user or null if not authenticated.
   */
  loadCurrentUser(): Observable<User | null> {
    return this.store.loadCurrentUser();
  }

  /**
   * Updates the avatar color for the current user.
   *
   * @param avatarColor The new avatar color.
   * @returns An Observable of the updated user.
   */
  updateAvatarColor(avatarColor: string): Observable<User> {
    return this.store.updateAvatarColor(avatarColor);
  }
}
