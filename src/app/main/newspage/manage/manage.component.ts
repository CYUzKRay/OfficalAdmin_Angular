import { Component, OnInit } from '@angular/core';
import { NewsPageManage } from './manage';
import { Router } from '@angular/router';
import { HttpService } from 'src/app/share/service/http.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.css'],
})
export class ManageComponent implements OnInit {
  newList: NewsPageManage[] = [];
  searchData = {
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
      .postJson('http://localhost:5133/api/News/News', this.searchData)
      .subscribe((x: any) => {
        this.totalCount = x.totalCount;

        const pageCount = Math.ceil(this.totalCount / this.pageSize);

        this.paginations = [];

        for (let i = 1; i <= pageCount; i++) {
          this.paginations.push(i);
        }
        this.newList = x.newsList;
      });
  }

  previewNews(newId: string) {
    this.route.navigate([`main/news/preview/${newId}`]);
  }

  editNews(newId: string) {
    this.route.navigate([`main/news/add/${newId}`]);
  }

  deleteNews(newId: string) {
    this.http
      .delete(`http://localhost:5133/api/News/DeleteNews/${newId}`)
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
