import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from 'src/app/share/service/http.service';
import { environment } from 'src/environments/environment';

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

  constructor(private router: Router, private http: HttpService) {}

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
          this.searchFaq();
        });
      }
    });
  }

  moveUp(index: number) {
    const faq = this.faqList[index];
    this.http
      .put<any>(`${environment.apiUrl}Faq/EditFaqSort/up`, { id: faq.id })
      .subscribe(() => {
        this.searchFaq();
      });
  }

  moveDown(index: number) {
    const faq = this.faqList[index];
    this.http
      .put<any>(`${environment.apiUrl}Faq/EditFaqSort/down`, { id: faq.id })
      .subscribe(() => {
        this.searchFaq();
      });
  }
}
