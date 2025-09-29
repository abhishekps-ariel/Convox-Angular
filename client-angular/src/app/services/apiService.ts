import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';
import type { User, Conversation, Group } from '../types/chatTypes';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient) {}

  private getAuthHeaders(token?: string): HttpHeaders {
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  private getJsonHeaders(token?: string): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  // GET request
  get<T>(url: string, token?: string): Observable<T> {
    return this.http
      .get<T>(url, { headers: this.getAuthHeaders(token) })
      .pipe(catchError(this.handleError));
  }

  // POST request
  post<T>(url: string, body: any, token?: string): Observable<T> {
    return this.http
      .post<T>(url, body, { headers: this.getJsonHeaders(token) })
      .pipe(catchError(this.handleError));
  }

  // PUT request
  put<T>(url: string, body: any, token?: string): Observable<T> {
    return this.http
      .put<T>(url, body, { headers: this.getJsonHeaders(token) })
      .pipe(catchError(this.handleError));
  }

  // DELETE request
  delete<T>(url: string, token?: string): Observable<T> {
    return this.http
      .delete<T>(url, { headers: this.getAuthHeaders(token) })
      .pipe(catchError(this.handleError));
  }

  // Error handler
  private handleError(error: any) {
    console.error('API error:', error);
    return throwError(() => error);
  }

  // Chat-specific API methods
  fetchUsers(token: string): Observable<User[]> {
    return this.get<User[]>(`${environment.API_URL}/api/users`, token);
  }

  fetchConversations(token: string): Observable<Conversation[]> {
    return this.get<Conversation[]>(`${environment.API_URL}/api/conversations`, token);
  }

  fetchUserGroups(token: string): Observable<Group[]> {
    return this.get<Group[]>(`${environment.API_URL}/api/groups`, token);
  }

  markMessagesAsRead(token: string, senderId: string): Observable<any> {
    return this.post(`${environment.API_URL}/api/messages/markAsRead`, { senderId }, token);
  }

  checkBlockStatus(token: string, userId: string): Observable<{ isBlockedByMe: boolean; isBlockedByThem: boolean }> {
    return this.get(`${environment.API_URL}/api/users/${userId}/block-status`, token);
  }
}
