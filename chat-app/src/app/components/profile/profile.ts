import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-profile',
  imports: [AsyncPipe, MatIconModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  private authService = inject(AuthService);

  currentUser$ = this.authService.getCurrentUser();

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        window.location.reload();
      },
      error: (err) => console.error('Logout failed', err)
    });
  }
}