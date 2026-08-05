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

  /**
   * Initiates the Google login process by calling the AuthService's loginWithGoogle method.
   * On successful login, navigates to the home page. On failure, sets an appropriate error message.
   */

  loginWithGoogle() {
    window.location.href = 'http://localhost:3000/api/auth/login/google';
  }

  /**
   * Initiates the Facebook login process by calling the AuthService's loginWithFacebook method.
   * On successful login, navigates to the home page. On failure, sets an appropriate error message.
   */
  loginWithFacebook() {
    window.location.href = 'http://localhost:3000/api/auth/login/facebook';
  }
}
