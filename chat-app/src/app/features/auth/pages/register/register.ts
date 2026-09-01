import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth-service'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const email = this.email.trim();

    if (!EMAIL_REGEX.test(email)) {
      this.errorMessage = 'Please provide a valid email address.';
      return;
    }

    this.authService.register({ email, username: this.username, password: this.password }).subscribe({
      next: (response) => {
        console.log('Registered successfully!', response);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.log('Registration failed', err);
        this.errorMessage = err.error?.error ?? 'Registration failed. Please try again.';
      }
    });
  }

  loginWithGoogle() {
    window.location.href = 'http://localhost:3000/api/auth/login/google';
  }

  loginWithFacebook() {
    window.location.href = 'http://localhost:3000/api/auth/login/facebook';
  }
}
