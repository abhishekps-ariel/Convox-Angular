import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  @Output() toggleMode = new EventEmitter<void>();

  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  isSubmitting = false;
  errorMessage = '';

  constructor(private authService: AuthService) {}

  async onSubmit(): Promise<void> {
    if (this.isSubmitting) return;

    // Basic validation
    if (!this.username || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    if (this.username.length < 3) {
      this.errorMessage = 'Username must be at least 3 characters';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      await this.authService.register(this.username, this.email, this.password);
    } catch (error: any) {
      this.errorMessage = error?.error?.message || error?.message || 'Registration failed';
    } finally {
      this.isSubmitting = false;
    }
  }

  onToggleMode(): void {
    this.toggleMode.emit();
  }
}
