import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Navbar } from '../navbar/navbar';
import { Login } from '../login/login';
import { Register } from '../register/register';

@Component({
  selector: 'app-app-content',
  imports: [CommonModule, Navbar, Login, Register],
  templateUrl: './app-content.html'
})
export class AppContent {
  isLoginMode = signal(true);
  user = signal<any>(null);
  loading = signal(true);

  constructor(private authService: AuthService) {
    // Subscribe to auth state changes
    this.authService.user$.subscribe(user => {
      this.user.set(user);
    });

    this.authService.loading$.subscribe(loading => {
      this.loading.set(loading);
    });
  }

  onToggleMode() {
    this.isLoginMode.set(!this.isLoginMode());
  }
}
