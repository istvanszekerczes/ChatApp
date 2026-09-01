import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth-service'

@Component({
  selector: 'app-login',
  imports: [RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  errorMessage = '';

  /**
   * Handles the login process by calling the AuthService's login method with the provided email and password.
   * On successful login, navigates to the home page. On failure, sets an appropriate error message.
   */
  onLogin() {
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        console.log('Logged in successfully!', response.user);
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Login failed', err);
        this.errorMessage =
          err.status === 401
            ? 'Invalid email or password.'
            : 'Something went wrong. Please try again.';
      },
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
