import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SitePublishService } from '../service/site-publish.service';

/**
 * 「有已儲存但尚未發布的變更」提示 + 送出按鈕。
 *
 * 排序端點刻意不自動發布(連續調整順序時每按一次就重產整站太吵),
 * 所以每個有排序功能的管理頁都需要一個送出的入口。做成共用元件而不是各頁複製,
 * 是為了讓四個頁面的行為與文案完全一致。
 *
 * 待發布的狀態由**後端**保管(`SitePublishStatus.hasUnpublishedChanges`),
 * 所以重新整理頁面不會消失。
 */
@Component({
  selector: 'app-publish-pending',
  templateUrl: './publish-pending.component.html',
  styleUrls: ['./publish-pending.component.css'],
})
export class PublishPendingComponent implements OnInit, OnDestroy {
  hasPending = false;
  isPublishing = false;

  private sub?: Subscription;

  constructor(private sitePublish: SitePublishService) {}

  ngOnInit(): void {
    this.sub = this.sitePublish.hasPendingChanges$.subscribe(
      (p) => (this.hasPending = p)
    );
    this.sitePublish.refresh();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  publish(): void {
    if (this.isPublishing) {
      return;
    }
    this.isPublishing = true;
    this.sitePublish.publish().subscribe({
      next: () => (this.isPublishing = false),
      error: () => {
        this.isPublishing = false;
        alert('無法排入發布作業,請確認後端服務是否正常。');
      },
    });
  }
}
