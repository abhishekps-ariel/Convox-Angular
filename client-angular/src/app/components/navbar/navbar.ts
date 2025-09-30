import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User } from '../../types/chat-types';
import { ProfileModal } from '../profile-modal/profile-modal';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, ProfileModal],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar {
  user: User | null = null;
  showProfileModal = false;

  constructor(private authService: AuthService) {
    this.authService.user$.subscribe(user => {
      this.user = user;
    });
  }

  openProfileModal(): void {
    this.showProfileModal = true;
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
  }

  logout(): void {
    this.authService.logout();
    localStorage.clear();
    window.location.reload();
  }
}