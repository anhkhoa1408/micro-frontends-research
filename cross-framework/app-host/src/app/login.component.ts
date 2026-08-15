import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { authService } from '@mfe/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-container">
      <h2>Login</h2>
      <form (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            type="text"
            [(ngModel)]="username"
            name="username"
            required
            autocomplete="username"
          />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            [(ngModel)]="password"
            name="password"
            required
            autocomplete="current-password"
          />
        </div>
        @if (error) {
          <div class="error">{{ error }}</div>
        }
        <button type="submit" [disabled]="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>
      <p class="hint">Test accounts: admin/admin123 or user/user123</p>
    </div>
  `,
  styles: [
    `
      .login-container {
        max-width: 400px;
        margin: 2rem auto;
        padding: 2rem;
        border: 1px solid #ddd;
        border-radius: 8px;
      }
      .form-group {
        margin-bottom: 1rem;
      }
      label {
        display: block;
        margin-bottom: 0.25rem;
        font-weight: 500;
      }
      input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-sizing: border-box;
      }
      button {
        width: 100%;
        padding: 0.75rem;
        background: #1976d2;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
      }
      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .error {
        color: #d32f2f;
        margin-bottom: 1rem;
        padding: 0.5rem;
        background: #ffebee;
        border-radius: 4px;
      }
      .hint {
        margin-top: 1rem;
        color: #666;
        font-size: 0.85rem;
        text-align: center;
      }
    `,
  ],
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(private router: Router) {}

  async onSubmit() {
    this.error = '';
    this.loading = true;

    try {
      await authService.login({
        username: this.username,
        password: this.password,
      });
      this.router.navigate(['/']);
    } catch (e: any) {
      this.error = e.message || 'Login failed';
    } finally {
      this.loading = false;
    }
  }
}
