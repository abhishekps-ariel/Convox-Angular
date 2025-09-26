import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() {}

  // Dummy login: always resolves successfully
  login(email: string, password: string): Promise<void> {
    console.log('Login called with', email, password);
    return Promise.resolve();
  }

  // Dummy register: always resolves successfully
  register(username: string, email: string, password: string): Promise<void> {
    console.log('Register called with', username, email, password);
    return Promise.resolve();
  }
}

