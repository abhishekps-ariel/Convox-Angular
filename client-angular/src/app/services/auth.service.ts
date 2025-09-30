import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { AUTH_ENDPOINTS } from '../constants/api-endpoints';
import { User } from '../types/chat-types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(true);

  user$ = this.userSubject.asObservable();
  token$ = this.tokenSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  get user(): User | null {
    return this.userSubject.value;
  }

  get token(): string | null {
    return this.tokenSubject.value;
  }

  get loading(): boolean {
    return this.loadingSubject.value;
  }

  constructor(private http: HttpClient) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      if (this.isTokenValid(storedToken)) {
        this.tokenSubject.next(storedToken);
        this.userSubject.next(JSON.parse(storedUser));
      } else {
        this.clearAuthData();
      }
    }
    this.loadingSubject.next(false);
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

  private clearAuthData(): void {
    this.userSubject.next(null);
    this.tokenSubject.next(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  private saveAuthData(token: string, user: User): void {
    this.tokenSubject.next(token);
    this.userSubject.next(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  async login(email: string, password: string): Promise<void> {
    try {
      this.clearAuthData();
      
      const data = await this.http.post<{ token: string; user: User }>(
        AUTH_ENDPOINTS.LOGIN,
        { email, password }
      ).toPromise();

      if (data) {
        this.saveAuthData(data.token, data.user);
      }
    } catch (error) {
      this.clearAuthData();
      throw error;
    }
  }

  async register(username: string, email: string, password: string): Promise<void> {
    try {
      this.clearAuthData();
      
      const data = await this.http.post<{ token: string; user: User }>(
        AUTH_ENDPOINTS.REGISTER,
        { username, email, password }
      ).toPromise();

      if (data) {
        this.saveAuthData(data.token, data.user);
      }
    } catch (error) {
      this.clearAuthData();
      throw error;
    }
  }

  logout(): void {
    this.clearAuthData();
  }

  updateUser(updatedUser: User): void {
    this.userSubject.next(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }
}