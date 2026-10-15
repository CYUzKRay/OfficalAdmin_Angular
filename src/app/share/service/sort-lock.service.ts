import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, TimeoutError, finalize, timeout } from 'rxjs';

/**
 * 排序操作的進行中狀態。
 *
 * 解決兩個問題:
 *
 * 1. **連點產生競態。** 排序是「與相鄰一筆交換」,送出後列表才重讀。
 *    在回應回來之前再按一次,第二次送出的是**舊順序**算出來的請求,
 *    兩個請求交錯回來的結果無法預測。而 `orders` 在資料庫沒有唯一索引
 *    (見 API 專案 README),順序本來就不保證穩定,更禁不起競態。
 *
 * 2. **按下去沒有任何回饋。** 排序要等後端來回,慢的時候操作者會以為沒反應又多按幾次,
 *    正好製造上面那個競態。
 *
 * 所以採全域鎖:**同一時間只允許一個排序請求**,不分頁面、不分項目。
 * 鎖住期間所有排序按鈕 disabled,被按的那一顆原地轉圈。
 */
@Injectable({ providedIn: 'root' })
export class SortLockService {
  /**
   * 逾時門檻。
   *
   * 存在的理由不是「通知使用者很慢」,而是**避免 UI 永久卡死** ——
   * 連線中斷時 HTTP 請求不會自己結束,沒有逾時的話排序按鈕會一直鎖著,
   * 使用者只能自己重整頁面,而且不知道發生什麼事。
   *
   * 15 秒:排序是單純的資料庫更新,正常遠低於一秒。曾經有過一次排序花 12 秒的紀錄
   * (`DbSet.ToListAsync()` 等於 `SELECT *`,載入了 631 萬字元內文),那個已經用投影修掉。
   * 門檻訂在那次事故之上,確保只有真的異常才會觸發。
   */
  private static readonly TIMEOUT_MS = 15000;

  /** 目前進行中的排序鍵;沒有排序在跑時為 null */
  private readonly busyKeySubject = new BehaviorSubject<string | null>(null);

  readonly busyKey$ = this.busyKeySubject.asObservable();

  /** 有任何排序在進行中。所有排序按鈕都看這個決定要不要 disabled */
  get isBusy(): boolean {
    return this.busyKeySubject.value !== null;
  }

  /** 是不是「這一顆」按鈕在進行中。只有它要顯示轉圈 */
  isBusyKey(key: string): boolean {
    return this.busyKeySubject.value === key;
  }

  /**
   * 包住一次排序請求,期間上鎖。
   *
   * 已經有排序在跑時回傳 `EMPTY` —— **直接忽略這次點擊,不排隊**。
   * 排隊會讓使用者連按五次就跑五次,而中間每一次算出來的相鄰項目都是過期的。
   *
   * 逾時會讓 observable 以 `TimeoutError` 結束,並且**取消底層的 HTTP 請求**。
   * 注意這不代表後端沒做 —— 它可能已經完成了,只是回應沒回來,
   * 所以呼叫端的訊息要說「請重新整理確認」,不要說「失敗」。
   */
  run<T>(key: string, request: Observable<T>): Observable<T> {
    if (this.isBusy) {
      return EMPTY;
    }

    this.busyKeySubject.next(key);

    return request.pipe(
      timeout(SortLockService.TIMEOUT_MS),
      // finalize 在成功、錯誤、逾時、取消訂閱四種情況都會跑到。
      // 放在 next/error 裡解鎖的話,元件被銷毀時會漏掉,鎖就永遠解不開。
      finalize(() => this.busyKeySubject.next(null))
    );
  }

  /** 區分逾時與一般錯誤,兩者要給使用者不同的訊息 */
  static isTimeout(error: unknown): boolean {
    return error instanceof TimeoutError;
  }

  /** 排序失敗時統一的提示文字 */
  static message(error: unknown): string {
    return SortLockService.isTimeout(error)
      ? '排序逾時。後端可能已經完成,請重新整理頁面確認結果。'
      : '排序失敗,請稍後再試。';
  }
}
