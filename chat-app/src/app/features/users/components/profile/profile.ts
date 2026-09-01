import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth-service';
import { ColorPicker } from '../../../../shared/components/color-picker/color-picker';
import { InitialPipe } from '../../../../shared/pipes/initial-pipe';

@Component({
  selector: 'app-profile',
  imports: [AsyncPipe, MatIconModule, RouterLink, ColorPicker, InitialPipe],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  authService = inject(AuthService);
  currentUser$ = this.authService.currentUser$;

  pickerOpen = false;

  chooseColor(color: string) {
    this.authService.updateAvatarColor(color).subscribe({
      next: () => { this.pickerOpen = false; },
      error: (err) => console.error('Failed to save avatar color', err),
    });
  }

  onLogout() {
    this.authService.logout().subscribe();
  }

  togglePicker(event: MouseEvent) {
    event.stopPropagation();
    this.pickerOpen = !this.pickerOpen;
  }
}