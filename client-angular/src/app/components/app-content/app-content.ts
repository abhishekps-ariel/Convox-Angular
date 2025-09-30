import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User } from '../../types/chat-types';
import { Login } from '../../pages/login/login';
import { Register } from '../../pages/register/register';
import { ChatInterface } from '../../pages/chat-interface/chat-interface';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-app-content',
  standalone: true,
  imports: [CommonModule, Login, Register, ChatInterface, Navbar],
  templateUrl: './app-content.html',
  styleUrls: ['./app-content.css']
})
export class AppContent implements OnInit {
  user: User | null = null;
  loading = true;
  isLoginMode = true;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.user = user;
    });

    this.authService.loading$.subscribe(loading => {
      this.loading = loading;
    });
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
  }
}