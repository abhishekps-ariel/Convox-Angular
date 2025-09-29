import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User } from '../types/chat-types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(true);

  public user$ = this.userSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  // Signals for reactive programming
  public user = signal<User | null>(null);
  public token = signal<string | null>(null);
  public loading = signal<boolean>(true);

  constructor(private apiService: ApiService) {
    this.initializeAuth();
  }

  private initializeAuth() {
    // Check for stored token on app load
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      if (this.isTokenValid(storedToken)) {
        this.setAuthData(storedToken, JSON.parse(storedUser));
      } else {
        // Token expired or invalid, clear it
        this.clearAuthData();
      }
    }
    this.setLoading(false);
  }

  private isTokenValid(token: string): boolean {
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return tokenData.exp && tokenData.exp > currentTime;
    } catch {
      return false;
    }
  }

  private setAuthData(newToken: string, newUser: User) {
    this.tokenSubject.next(newToken);
    this.userSubject.next(newUser);
    this.token.set(newToken);
    this.user.set(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  }

  private clearAuthData() {
    this.userSubject.next(null);
    this.tokenSubject.next(null);
    this.user.set(null);
    this.token.set(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  private setLoading(loading: boolean) {
    this.loadingSubject.next(loading);
    this.loading.set(loading);
  }

  async login(email: string, password: string): Promise<void> {
    try {
      // Clear any existing tokens first
      this.clearAuthData();
      
      const data = await this.apiService.login(email, password);
      this.setAuthData(data.token, data.user);
    } catch (error) {
      // Clear tokens on error
      this.clearAuthData();
      throw error;
    }
  }

  async register(username: string, email: string, password: string): Promise<void> {
    try {
      // Clear any existing tokens first
      this.clearAuthData();
      
      const data = await this.apiService.register(username, email, password);
      this.setAuthData(data.token, data.user);
    } catch (error) {
      // Clear tokens on error
      this.clearAuthData();
      throw error;
    }
  }

  logout(): void {
    this.clearAuthData();
  }

  updateUser(updatedUser: User): void {
    this.userSubject.next(updatedUser);
    this.user.set(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  getCurrentToken(): string | null {
    return this.tokenSubject.value;
  }

  isAuthenticated(): boolean {
    return this.userSubject.value !== null;
  }
}
