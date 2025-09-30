import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  @Output() toggleMode = new EventEmitter<void>();

  email = '';
  password = '';
  isSubmitting = false;
  errorMessage = '';

  constructor(private authService: AuthService) {}

  async onSubmit(): Promise<void> {
    if (this.isSubmitting) return;

    // Basic validation
    if (!this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      await this.authService.login(this.email, this.password);
    } catch (error: any) {
      this.errorMessage = error?.error?.message || error?.message || 'Login failed';
    } finally {
      this.isSubmitting = false;
    }
  }

  onToggleMode(): void {
    this.toggleMode.emit();
  }
}
