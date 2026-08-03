import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, catchError, of, tap } from 'rxjs';
import { User } from '../models/user';
import { environment } from '../environments/environment';

interface RegisterResponse {
  message: string;
  userId: string;
}

interface LoginResponse {
  message: string;
  user: User;
}

@Service()
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;


  private currentUserSubject = new BehaviorSubject<User | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  readonly avatarColors = [
    '#3b82f6', '#ef4444', '#22c55e', '#a855f7', '#f59e0b', '#ec4899',
  ];

  register(userData: { email: string; username: string; password: string }): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, userData, { withCredentials: true });
  }

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials, { withCredentials: true }).pipe(
      tap(response => this.currentUserSubject.next(response.user))
    );
  }

  logout(): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => this.currentUserSubject.next(null))
    );
  }

  loadCurrentUser(): Observable<User | null> {
    return this.http.get<{ user: User }>(`${this.apiUrl}/me`, { withCredentials: true }).pipe(
      map(response => response.user),
      tap(user => this.currentUserSubject.next(user)),
      catchError(() => {
        this.currentUserSubject.next(null);
        return of(null);
      })
    );
  }

  updateAvatarColor(avatarColor: string): Observable<User> {
    return this.http
      .patch<{ user: User }>(`${this.apiUrl}/me`, { avatarColor }, { withCredentials: true })
      .pipe(
        map(response => response.user),
        tap(user => this.currentUserSubject.next(user))
      );
  }
}