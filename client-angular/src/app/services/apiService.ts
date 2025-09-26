import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
}
