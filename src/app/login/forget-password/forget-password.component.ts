import { Component } from '@angular/core';
import { HttpService } from '../../share/service/http.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-forget-password',
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.css']
})
export class ForgetPasswordComponent {
  email: string = '';

  constructor(private http: HttpService) {}

  SendResetLink() {
    this.http.postJson<any>(`${environment.apiUrl}Auth/ForgotPassword`, { email: this.email }).subscribe({
      next: (res) => {
        if (res && res.isSuccess) {
          alert('重設密碼信件已發送！請至信箱收取並點擊連結重設密碼。');
        } else {
          alert(res.message || '發送失敗！請稍後再試。');
        }
      },
      error: (err) => {
        console.error(err);
        alert('發生系統錯誤，請聯絡管理員！');
      }
    });
  }
}
