import { Service, inject } from '@angular/core';
import { Observable, BehaviorSubject, map, catchError, of, tap } from 'rxjs';
import { User } from '../../features/users/models/user';
import { BackendCommunicator } from './backend-communicator';

@Service()
export class AuthService {
  private backendCommunicator = inject(BackendCommunicator);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

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
      .pipe(tap((response) => this.currentUserSubject.next(response.user)));
  }

  /**
   * Logs the user out and clears their session.
   *
   * @returns An Observable indicating the success or failure of the logout operation.
   */
  logout(): Observable<unknown> {
    return this.backendCommunicator.logout().pipe(tap(() => this.currentUserSubject.next(null)));
  }

  /**
   * Loads the current user from the server and updates the currentUserSubject.
   *
   * @returns An Observable of the current user or null if not authenticated.
   */
  loadCurrentUser(): Observable<User | null> {
    return this.backendCommunicator
    .loadCurrentUser()
    .pipe(
      map((response) => response.user),
      tap((user) => this.currentUserSubject.next(user)),
      catchError(() => {
        this.currentUserSubject.next(null);
        return of(null);
      }),
    );
  }

  /**
   * Updates the avatar color for the current user.
   *
   * @param avatarColor The new avatar color.
   * @returns An Observable of the updated user.
   */
  updateAvatarColor(avatarColor: string): Observable<User> {
    return this.backendCommunicator
      .updateAvatarColor(avatarColor)
      .pipe(
        map((response) => response.user),
        tap((user) => this.currentUserSubject.next(user)),
      );
  }
}
