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