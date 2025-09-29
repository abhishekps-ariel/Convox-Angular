// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { ApiService } from './apiService';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';

const API_URL = environment.API_URL;

export const AUTH_ENDPOINTS = {
  LOGIN: `${API_URL}/api/auth/login`,
  REGISTER: `${API_URL}/api/auth/register`,
};

export interface User {
  id: string;
  username: string;
  email: string;
  bio?: string;
  profilePicture?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  user$ = this.userSubject.asObservable();
  token$ = this.tokenSubject.asObservable();

  constructor(private api: ApiService) {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    console.log('Loading from storage - token:', token ? 'present' : 'missing', 'user:', user ? 'present' : 'missing');
    if (token && user) {
      this.tokenSubject.next(token);
      this.userSubject.next(JSON.parse(user));
      console.log('Token and user loaded from storage');
    }
  }

  private saveToStorage(token: string, user: User) {
    console.log('Saving to storage - token:', token ? 'present' : 'missing', 'user:', user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.tokenSubject.next(token);
    this.userSubject.next(user);
    console.log('Token and user saved to storage');
  }

  private clearStorage() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.tokenSubject.next(null);
    this.userSubject.next(null);
  }

  login(email: string, password: string): Observable<any> {
    return this.api.post(AUTH_ENDPOINTS.LOGIN, { email, password }).pipe(
      tap((res: any) => {
        this.saveToStorage(res.token, res.user);
      })
    );
  }

  register(username: string, email: string, password: string): Observable<any> {
    return this.api.post(AUTH_ENDPOINTS.REGISTER, { username, email, password }).pipe(
      tap((res: any) => {
        this.saveToStorage(res.token, res.user);
      })
    );
  }

  logout() {
    this.clearStorage();
  }

  get isLoggedIn(): boolean {
    return !!this.tokenSubject.value;
  }

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  get currentUserId(): string | null {
    return this.userSubject.value?.id || null;
  }
}
