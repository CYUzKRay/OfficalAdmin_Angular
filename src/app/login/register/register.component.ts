import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from '../../share/service/http.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  data = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  constructor(private http: HttpService, private router: Router) {}

  Register() {
    if (this.data.password !== this.data.confirmPassword) {
      alert('密碼與確認密碼不相符！');
      return;
    }

    const payload = {
      name: this.data.name,
      email: this.data.email,
      password: this.data.password
    };

    this.http.postJson<any>(`${environment.apiUrl}Auth/Register`, payload).subscribe({
      next: (res) => {
        if (res && res.isSuccess) {
          alert('註冊成功！將自動為您登入。');

          this.router.navigate(['/main']);
        } else {
          alert(res.message || '註冊失敗！請檢查資料是否正確，或 Email 是否已被註冊。');
        }
      },
      error: (err) => {
        console.error(err);
        alert('註冊發生錯誤，請稍後再試！');
      }
    });
  }
}
