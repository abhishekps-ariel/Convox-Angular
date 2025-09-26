import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/authService';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

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

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isSubmitting = true;
    this.status = '';
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password)
      .pipe(
        catchError((err) => {
          
          this.status = err.error?.message || 'Invalid email or password';
          this.isSubmitting = false;
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (res) => {
          
          console.log('Login success:', res);
          this.router.navigate(['/chat']);
          this.isSubmitting = false;
        },
      });
  }
}
