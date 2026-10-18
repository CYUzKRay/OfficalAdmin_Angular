import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from 'src/app/share/service/http.service';
import { SitePublishService } from 'src/app/share/service/site-publish.service';
import { SortLockService } from 'src/app/share/service/sort-lock.service';
import { environment } from 'src/environments/environment';
import { Response } from 'src/app/core/api/models';

export interface FaqListModel {
  id: string;
  question: string;
  status: boolean;
  orders: number;
}

export interface FaqPaginationModel {
  totalCount: number;
  faqList: FaqListModel[];
}

export interface FaqModelResponseData {
  data?: {
    id: string;
    question: string;
    answer: string;
    status: boolean;
  };
}

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.css']
})
export class ManageComponent implements OnInit {
  faqList: FaqListModel[] = [];

  constructor(
    private router: Router,
    private http: HttpService,
    private sitePublish: SitePublishService,
    /** 模板要讀 isBusy / isBusyKey,所以是 public */
    public sortLock: SortLockService
  ) {}

  ngOnInit(): void {
    this.searchFaq();
  }

  searchFaq() {
    const searchData = {
      pageIndex: 0,
      pageSize: 100 // 暫時一次取回全部
    };

    this.http
      .postJson<FaqPaginationModel>(`${environment.apiUrl}Faq/Faqs`, searchData)
      .subscribe((res: FaqPaginationModel) => {
        this.faqList = res.faqList || [];
      });
  }

  editFaq(id: string) {
    this.router.navigate(['/main/faq/add'], { queryParams: { id } });
  }

  deleteFaq(id: string) {
    if (confirm('確定要刪除此常見問題嗎？')) {
      this.http
        .delete<any>(`${environment.apiUrl}Faq/DeleteFaq/${id}`)
        .subscribe(() => {
          // 內容異動會讓後端自動排入整站重新發布,重讀狀態讓 navbar 立刻反映
          this.sitePublish.refresh();
          this.searchFaq();
        });
    }
  }

  toggleStatus(faq: FaqListModel) {
    // 取得完整資料以更新狀態
    this.http.get<FaqModelResponseData>(`${environment.apiUrl}Faq/Preview/${faq.id}`).subscribe(res => {
      if (res.data) {
        const updateData = {
          id: res.data.id,
          question: res.data.question,
          answer: res.data.answer,
          status: !res.data.status
        };
        this.http.postJson<any>(`${environment.apiUrl}Faq/CreateFaq`, updateData).subscribe(() => {
          // 內容異動會讓後端自動排入整站重新發布,重讀狀態讓 navbar 立刻反映
          this.sitePublish.refresh();
          this.searchFaq();
        });
      }
    });
  }

  moveUp(index: number) {
    this.move(index, 'up');
  }

  moveDown(index: number) {
    this.move(index, 'down');
  }

  /**
   * 與相鄰一筆交換排序。
   *
   * 後端回 HTTP 200 + isSuccess false 代表已在最前/最後,不是錯誤 ——
   * 這是既有合約,顯示訊息就好,不要當失敗處理。
   */
  private move(index: number, direction: 'up' | 'down') {
    const faq = this.faqList[index];
    if (!faq) return;

    this.sortLock
      .run(
        `faq:${index}:${direction}`,
        this.http.put<Response>(
          `${environment.apiUrl}Faq/EditFaqSort/${direction}`,
          { id: faq.id }
        )
      )
      .subscribe({
        next: (res) => {
          if (res?.isSuccess === false) {
            alert(res.message ?? '無法再移動');
            return;
          }
          // 排序是延後發布,待發布標記由後端記錄,重讀狀態把它拿回來
          this.sitePublish.refresh();
          this.searchFaq();
        },
        error: (err) => alert(SortLockService.message(err)),
      });
  }
}
