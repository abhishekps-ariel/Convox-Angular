import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/authService';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
// ...existing code...

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})
export class LoginComponent {
  loginForm: FormGroup;
  status: string = '';
  isSubmitting: boolean = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  async onSubmit() {
    if (this.loginForm.invalid) return;

    this.isSubmitting = true;
    this.status = '';
    const { email, password } = this.loginForm.value;

    try {
      await this.authService.login(email, password);
      this.router.navigate(['/chat']); 
    } catch (err: any) {
      this.status = err?.message || 'Login failed';
    } finally {
      this.isSubmitting = false;
    }
  }
}
