import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html'
})
export class Register {
  onToggleMode = output<void>();
  
  registerForm: FormGroup;
  isSubmitting = signal(false);
  status = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      if (confirmPassword?.errors?.['passwordMismatch']) {
        delete confirmPassword.errors['passwordMismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
    }
    
    return null;
  }

  async onSubmit() {
    if (this.registerForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);
      this.status.set('');

      try {
        const { username, email, password } = this.registerForm.value;
        await this.authService.register(username, email, password);
      } catch (err) {
        this.status.set(err instanceof Error ? err.message : 'Registration failed');
      } finally {
        this.isSubmitting.set(false);
      }
    }
  }

  onToggle() {
    this.onToggleMode.emit();
  }
}
