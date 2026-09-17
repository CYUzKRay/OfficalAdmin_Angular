import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from 'src/app/share/service/http.service';
import { environment } from 'src/environments/environment';
import {
  NewListModel,
  NewsSearchParametersModel,
  NewsPaginationModel,
  Response,
} from 'src/app/core/api/models';

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.css'],
})
export class ManageComponent implements OnInit {
  newList: NewListModel[] = [];
  searchData: NewsSearchParametersModel = {
    classification: '',
    keyword: '',
    status: undefined,
    pageIndex: 0,
  };

  currentPageIndex: number = 0;
  pageSize = 10;
  paginations: number[] = [];
  totalCount = 0;
  constructor(
    private route: Router,
    private http: HttpService,
  ) {}
  ngOnInit(): void {
    this.shearchNews();
  }

  setPage(index: number) {
    this.searchData.pageIndex = index - 1;
    this.shearchNews();
  }

  shearchNews() {
    this.http
      .postJson<NewsPaginationModel>(
        `${environment.apiUrl}News/News`,
        this.searchData,
      )
      .subscribe((x) => {
        this.totalCount = x.totalCount ?? 0;

        const pageCount = Math.ceil(this.totalCount / this.pageSize);

        this.paginations = [];

        for (let i = 1; i <= pageCount; i++) {
          this.paginations.push(i);
        }
        this.newList = x.newsList ?? [];
      });
  }

  previewNews(newId?: string) {
    if (!newId) return;
    this.route.navigate([`main/news/preview/${newId}`]);
  }

  editNews(newId?: string) {
    if (!newId) return;
    this.route.navigate([`main/news/add/${newId}`]);
  }

  /**
   * 與相鄰一筆交換排序。
   *
   * 端點形狀跟產品那支不同:產品是 `EditProductSort/{id}/{direction}`,
   * 消息是 `EditNewsSort/{direction}` + body 帶 id,這是既有合約不動它。
   *
   * 後端回 HTTP 200 + isSuccess false 代表已在最前/最後,不是錯誤,
   * 把訊息顯示出來就好,不要當成失敗。
   */
  editNewsSort(newId: string | undefined, direction: 'up' | 'down') {
    if (!newId) return;
    this.http
      .put<Response>(`${environment.apiUrl}News/EditNewsSort/${direction}`, {
        id: newId,
      })
      .subscribe((res) => {
        if (res?.isSuccess === false) {
          alert(res.message ?? '無法再移動');
          return;
        }
        this.shearchNews();
      });
  }

  deleteNews(newId?: string) {
    if (!newId) return;
    this.http
      .delete(`${environment.apiUrl}News/DeleteNews/${newId}`)
      .subscribe((x) => {
        this.newList = this.newList.filter((y) => {
          if (y.id != newId) {
            return true;
          } else {
            return false;
          }
        });

        console.log(this.newList);
      });
  }

  // changeCarouselStatus(carousel: ) {
  //     this.http
  //       .put<Boolean>(
  //         `${environment.apiUrl}Carousel/EditCarouselStatus/${carousel.id}`,
  //         null
  //       )
  //       .subscribe((x) => {
  //         carousel.status = !carousel.status;
  //       });
  //   }
}
