import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/authService';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
})
export class RegisterComponent {
  registerForm: FormGroup;
  status: string = '';
  isSubmitting: boolean = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: this.passwordMatch });
  }

  passwordMatch(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  async onSubmit() {
    if (this.registerForm.invalid) return;

    this.isSubmitting = true;
    this.status = '';
    const { username, email, password } = this.registerForm.value;

    try {
      await this.authService.register(username, email, password);
      this.router.navigate(['/chat']); // navigate to chat after successful registration
    } catch (err: any) {
      this.status = err?.message || 'Registration failed';
    } finally {
      this.isSubmitting = false;
    }
  }
}
