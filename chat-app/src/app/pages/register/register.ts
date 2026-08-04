import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  imports: [RouterLink, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  username = '';
  password = '';
  errorMessage = '';

  /**
   * Handles the registration process by calling the AuthService's register method with the provided email, username, and password.
   * On successful registration, navigates to the login page. On failure, sets an appropriate error message.
   */
  onRegister() {
    this.authService.register({ email: this.email, username: this.username, password: this.password }).subscribe({
      next: (response) => {
        console.log('Registered successfully!', response);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.log('Registration failed', err);
        this.errorMessage = 'Registration failed. Please try again.';
      }
    });
  }
}