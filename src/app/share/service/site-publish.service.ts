import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { HttpService } from './http.service';
import { environment } from '../../../environments/environment';

/** 對應後端的 SitePublishStatusModel */
export interface SitePublishStatus {
  /** Idle(未發布過)、Queued(排隊中)、Running(進行中)、Succeeded、Failed */
  phase: 'Idle' | 'Queued' | 'Running' | 'Succeeded' | 'Failed';
  /** Queued 或 Running 時為 true */
  isBusy: boolean;
  /** 觸發來源:「手動」或「產品異動」之類 */
  trigger: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  fileCount: number;
  uploadedCount: number;
  deletedCount: number;
  /** Skipped(未設定 distribution id)、Succeeded、Failed */
  cdnInvalidation: 'Skipped' | 'Succeeded' | 'Failed';
  errors: string[];
  /** 這一輪跑完還要再跑一次(發布途中又有人存檔) */
  hasQueuedRequest: boolean;
  /**
   * 有已儲存但尚未發布的變更(目前來源是排序)。
   * **由後端保管**,所以重新整理頁面不會消失 —— 放前端的話重整就忘了,
   * 操作者會以為什麼都沒發生,但資料庫其實已經變了。
   */
  hasUnpublishedChanges: boolean;
}

/** 對應後端的 SitePublishHistoryModel */
export interface SitePublishHistoryItem {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number;
  trigger: string | null;
  isSuccess: boolean;
  fileCount: number;
  uploadedCount: number;
  deletedCount: number;
  cdnInvalidation: 'Skipped' | 'Succeeded' | 'Failed';
  errors: string[];
}

interface HistoryResponse {
  data: SitePublishHistoryItem[];
  code: number;
  message: string;
  isSuccess: boolean;
}

interface StatusResponse {
  data: SitePublishStatus;
  code: number;
  message: string;
  isSuccess: boolean;
}

/**
 * 官網整站重新發布。
 *
 * 型別刻意寫在這裡而不是用 core/api 產生出來的 client —— 這個專案沒有設定
 * 產生器的執行腳本,新端點不會自動出現。等哪天重新產生 client 再換過去。
 */
@Injectable({ providedIn: 'root' })
export class SitePublishService implements OnDestroy {
  /** 發布中時的輪詢間隔。實測一次發布約 35–40 秒,兩秒一次夠即時又不會太吵 */
  private static readonly POLL_INTERVAL_MS = 2000;

  private readonly statusSubject = new BehaviorSubject<SitePublishStatus | null>(null);
  readonly status$ = this.statusSubject.asObservable();

  /**
   * 有「已存進資料庫、但還沒發布到官網」的變更。
   *
   * **狀態在後端**,這裡只是把它從 status 導出來 —— 早期版本放在前端記憶體,
   * 結果重新整理就消失,操作者會以為排序沒生效(但資料庫其實已經改了)。
   */
  readonly hasPendingChanges$ = this.status$.pipe(
    map((s) => !!s && s.hasUnpublishedChanges)
  );

  private pollTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private http: HttpService) {}

  /**
   * 排入一次整站重新發布。**不會等它跑完** —— 後端是背景執行,
   * 這裡拿到的是排入當下的狀態,結果靠輪詢。
   */
  publish(): Observable<StatusResponse> {
    return this.http
      .postJson<StatusResponse>(`${environment.apiUrl}SitePublish/Publish`, {})
      .pipe(tap((res) => this.apply(res?.data)));
  }

  /** 官網發布紀錄,新到舊 */
  history(take = 10): Observable<HistoryResponse> {
    return this.http.get<HistoryResponse>(
      `${environment.apiUrl}SitePublish/History`,
      { take }
    );
  }

  /** 讀一次目前狀態。進後台時呼叫一次,才知道是不是有別人觸發的發布正在跑 */
  refresh(): void {
    this.http
      .get<StatusResponse>(`${environment.apiUrl}SitePublish/Status`)
      .subscribe({
        next: (res) => this.apply(res?.data),
        // 讀狀態失敗不該跳錯誤給使用者看,停止輪詢即可
        error: () => this.stopPolling(),
      });
  }

  private apply(status?: SitePublishStatus): void {
    if (!status) {
      return;
    }
    this.statusSubject.next(status);

    // hasQueuedRequest 也要看:發布途中又有人存檔時還有下一輪,
    // 只看 isBusy 會在兩輪之間閃一下「完成」再變回「發布中」
    if (status.isBusy || status.hasQueuedRequest) {
      this.schedulePoll();
    } else {
      this.stopPolling();
    }
  }

  private schedulePoll(): void {
    this.stopPolling();
    this.pollTimer = setTimeout(() => this.refresh(), SitePublishService.POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.pollTimer !== null) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}
