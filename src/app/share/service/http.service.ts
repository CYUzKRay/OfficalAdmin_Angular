import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  constructor(private http: HttpClient) {}

  // 發送 JSON
  postJson<T>(url: string, data: any): Observable<T> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    return this.http.post<T>(url, data, { headers });
  }

  put<T>(url: string, data: any): Observable<T> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    return this.http.put<T>(url, data, { headers });
  }

  // 發送 FormData
  postForm<T>(url: string, data: Record<string, any>): Observable<T> {
    return this.http.post<T>(url, data); // 不要手動設 Content-Type，瀏覽器會自己帶
  }

  putForm<T>(url: string, data: Record<string, any>): Observable<T> {
    return this.http.put<T>(url, data);
  }

  // 如果需要 GET
  get<T>(url: string, params?: any): Observable<T> {
    return this.http.get<T>(url, { params });
  }

  delete<T>(url: string, params?: any): Observable<T> {
    return this.http.delete<T>(url, { params });
  }
}
