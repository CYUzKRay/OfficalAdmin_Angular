import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpService } from '../../share/service/http.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  token: string = '';
  newPassword: '' = '';
  confirmPassword: '' = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
    });
  }

  ResetPassword() {
    if (!this.token) {
      alert('無效的重設連結！');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      alert('密碼與確認密碼不相符！');
      return;
    }

    const payload = {
      token: this.token,
      newPassword: this.newPassword
    };

    this.http.postJson<any>(`${environment.apiUrl}Auth/ResetPassword`, payload).subscribe({
      next: (res) => {
        if (res && res.isSuccess) {
          alert('密碼重設成功！請使用新密碼重新登入。');
          this.router.navigate(['/login']);
        } else {
          alert(res.message || '重設失敗，Token 可能已失效，請重新申請！');
        }
      },
      error: (err) => {
        console.error(err);
        alert('發生系統錯誤，請聯絡管理員！');
      }
    });
  }
}
