import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from '../../share/service/http.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  data = {
    email: '',
    password: '',
  };
  rememberMe = false;

  constructor(private http: HttpService, private router: Router) {}

  ngOnInit() {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      this.data.email = savedEmail;
      this.rememberMe = true;
    }
  }

  Login() {
    this.http.postJson<any>(`${environment.apiUrl}Auth/Login`, this.data).subscribe({
      next: (res) => {
        if (res && res.isSuccess) {
          alert('登入成功！');

          if (this.rememberMe) {
            localStorage.setItem('rememberedEmail', this.data.email);
          } else {
            localStorage.removeItem('rememberedEmail');
          }
          this.router.navigate(['/main']);
        } else {
          alert(res.message || '登入失敗，請檢查帳號密碼！');
        }
      },
      error: (err) => {
        console.error(err);
        alert('登入失敗，發生未預期錯誤！');
      }
    });
  }
}

