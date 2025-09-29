import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html'
})
export class Login {
  onToggleMode = output<void>();
  
  loginForm: FormGroup;
  isSubmitting = signal(false);
  status = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  async onSubmit() {
    if (this.loginForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);
      this.status.set('');

      try {
        const { email, password } = this.loginForm.value;
        await this.authService.login(email, password);
      } catch (err) {
        this.status.set(err instanceof Error ? err.message : 'Login failed');
      } finally {
        this.isSubmitting.set(false);
      }
    }
  }

  onToggle() {
    this.onToggleMode.emit();
  }
}
