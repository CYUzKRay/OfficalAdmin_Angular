import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { HttpService } from '../../share/service/http.service';
import { SitePublishService, SitePublishStatus } from '../../share/service/site-publish.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isDropdownOpen = false;

  /** null 代表還沒讀到狀態(剛進後台) */
  publishStatus: SitePublishStatus | null = null;

  /** 有已儲存但還沒發布的變更(目前來自排序,那些端點刻意不自動發布) */
  hasPendingChanges = false;

  private statusSub?: Subscription;
  private navSub?: Subscription;
  private pendingSub?: Subscription;

  constructor(
    private router: Router,
    private http: HttpService,
    private sitePublish: SitePublishService
  ) {}

  ngOnInit(): void {
    this.statusSub = this.sitePublish.status$.subscribe((s) => (this.publishStatus = s));
    this.pendingSub = this.sitePublish.hasPendingChanges$.subscribe((p) => (this.hasPendingChanges = p));
    // 進後台先讀一次:發布也可能是別人觸發的,或是存檔後自動排入的
    this.sitePublish.refresh();

    // navbar 在版面裡,換頁不會重新初始化 —— 沒有這段的話「新增產品 → 存檔 → 返回列表」
    // 之後狀態還停在進站時讀到的那一筆,要重整整頁才看得到自動發布已經排入。
    // 存檔幾乎都伴隨一次導頁,用 NavigationEnd 補讀最省事也最貼合實際操作。
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.sitePublish.refresh());
  }

  ngOnDestroy(): void {
    this.statusSub?.unsubscribe();
    this.navSub?.unsubscribe();
    this.pendingSub?.unsubscribe();
  }

  get isPublishing(): boolean {
    return !!this.publishStatus && (this.publishStatus.isBusy || this.publishStatus.hasQueuedRequest);
  }

  /** 上一次發布失敗,或檔案上傳成功但 CDN 快取沒清掉 */
  get hasPublishProblem(): boolean {
    if (!this.publishStatus || this.isPublishing) {
      return false;
    }
    return this.publishStatus.phase === 'Failed' || this.publishStatus.cdnInvalidation === 'Failed';
  }

  get publishLabel(): string {
    return this.isPublishing ? '發布中…' : '重新發布官網';
  }

  /** 按鈕旁邊那行小字。刻意講人話,不要只丟狀態代號 */
  get publishHint(): string {
    const s = this.publishStatus;
    if (!s) {
      return '';
    }

    if (this.isPublishing) {
      return s.trigger ? `${s.trigger}，約需 40 秒` : '約需 40 秒';
    }

    // 排序這類變更已經進資料庫但不會自動發布,要提醒操作者還沒送出去
    if (this.hasPendingChanges) {
      return '有已儲存但尚未發布的變更';
    }

    switch (s.phase) {
      case 'Idle':
        return '尚未發布過';
      case 'Failed':
        return s.errors[0] ?? '發布失敗';
      case 'Succeeded':
        if (s.cdnInvalidation === 'Failed') {
          return '已上傳，但 CDN 快取未清除，官網可能仍顯示舊內容';
        }
        return `已發布 ${s.uploadedCount} 個檔案${this.finishedAtText(s)}`;
      default:
        return '';
    }
  }

  /** 完整錯誤清單,給滑鼠停留提示用 —— 小字放不下全部 */
  get publishTooltip(): string {
    const s = this.publishStatus;
    if (!s || s.errors.length === 0) {
      return '';
    }
    return s.errors.join('\n');
  }

  publishSite(): void {
    if (this.isPublishing) {
      return;
    }

    this.sitePublish.publish().subscribe({
      // 只有「排不進去」才在這裡提示。發布成功與否要靠輪詢,不在這裡判斷
      error: () => alert('無法排入發布作業，請確認後端服務是否正常。'),
    });
  }

  toggleUserDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  logout() {
    if(confirm('確定要登出嗎？')) {
      this.http.postJson(`${environment.apiUrl}Auth/Logout`, {}).subscribe({
        next: () => {
          this.router.navigate(['/login']);
        },
        error: () => {
          this.router.navigate(['/login']);
        }
      });
    }
  }

  private finishedAtText(s: SitePublishStatus): string {
    if (!s.finishedAt) {
      return '';
    }
    const d = new Date(s.finishedAt);
    const hh = `${d.getHours()}`.padStart(2, '0');
    const mm = `${d.getMinutes()}`.padStart(2, '0');
    return `（${hh}:${mm}）`;
  }
}
