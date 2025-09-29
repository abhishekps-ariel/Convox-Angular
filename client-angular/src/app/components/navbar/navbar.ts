import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User } from '../../types/chat-types';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule],
  templateUrl: './navbar.html'
})
export class Navbar {
  user = signal<User | null>(null);
  showProfileModal = signal(false);

  constructor(private authService: AuthService) {
    // Subscribe to user changes
    this.authService.user$.subscribe(user => {
      this.user.set(user);
    });
  }

  onProfileClick() {
    this.showProfileModal.set(true);
  }

  onCloseProfileModal() {
    this.showProfileModal.set(false);
  }

  onLogout() {
    this.authService.logout();
    localStorage.clear();
    window.location.reload();
  }

  getUserInitial(): string {
    const username = this.user()?.username;
    return username ? username.charAt(0).toUpperCase() : 'U';
  }
}
