import { Component } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpService } from 'src/app/share/service/http.service';
import { environment } from 'src/environments/environment';

/** 後端 SitePublish/Preview* 的回應:data 是完整的 HTML 文件 */
interface PreviewHtmlResponse {
  data?: string | null;
  isSuccess?: boolean;
  message?: string | null;
}

/**
 * 官網樣式預覽(消息、產品的「檢視」共用)。
 *
 * 直接掛在路由上,由路由 data 決定預覽什麼:
 * - `previewApi`:後端預覽端點,後面接路由的 :id(例:'SitePublish/PreviewNews/')
 * - `backUrl`:返回按鈕要回的列表頁
 */
@Component({
  selector: 'app-site-preview',
  templateUrl: './site-preview.component.html',
  styleUrls: ['./site-preview.component.css'],
})
export class SitePreviewComponent {
  html: SafeHtml | null = null;
  loading = true;
  error = '';
  private backUrl = '';

  constructor(
    private router: Router,
    private http: HttpService,
    private sanitizer: DomSanitizer,
    route: ActivatedRoute,
  ) {
    const previewApi: string = route.snapshot.data['previewApi'];
    this.backUrl = route.snapshot.data['backUrl'];

    route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) return;
      this.loading = true;
      this.error = '';
      this.http.get<PreviewHtmlResponse>(`${environment.apiUrl}${previewApi}${id}`).subscribe({
        next: (res) => {
          this.loading = false;
          // 內容來自自家後端用官網模板渲染的結果,不是外部輸入;
          // 不 bypass 的話 Angular 會拒絕把它綁到 srcdoc
          this.html = this.sanitizer.bypassSecurityTrustHtml(res.data ?? '');
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message ?? '預覽載入失敗,請稍後再試。';
        },
      });
    });
  }

  back() {
    this.router.navigate([this.backUrl]);
  }
}
