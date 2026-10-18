import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpXsrfTokenExtractor } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient, private router: Router, private tokenExtractor: HttpXsrfTokenExtractor) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 統一加上 withCredentials 確保攜帶 Cookie
    let authReq = req.clone({
      withCredentials: true
    });

    // Angular 的 HttpClientXsrfModule 預設不會攔截絕對路徑 (http://...)
    // 所以我們必須手動把 Cookie 中的 XSRF-TOKEN 取出並塞入 Header
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const xsrfToken = this.tokenExtractor.getToken();
      if (xsrfToken) {
        authReq = authReq.clone({
          headers: authReq.headers.set('X-XSRF-TOKEN', xsrfToken)
        });
      }
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !authReq.url.includes('Auth/Login') && !authReq.url.includes('Auth/RefreshToken')) {
          return this.handle401Error(authReq, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.http.post(`${environment.apiUrl}Auth/RefreshToken`, {}, { withCredentials: true }).pipe(
        switchMap(() => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(true);
          return next.handle(request.clone({ withCredentials: true }));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.router.navigate(['/login']);
          return throwError(() => err);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(() => {
          return next.handle(request.clone({ withCredentials: true }));
        })
      );
    }
  }
}
