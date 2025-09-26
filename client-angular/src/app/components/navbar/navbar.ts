import { Component } from '@angular/core';
import { AuthService, User } from '../../services/authService';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, AsyncPipe],
  templateUrl: './navbar.html',
})
export class NavbarComponent {
  constructor(public authService: AuthService, private router: Router) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
