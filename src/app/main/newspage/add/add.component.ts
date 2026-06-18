import { ActivatedRoute, Router } from '@angular/router';
import { Component } from '@angular/core';
import { HttpService } from 'src/app/share/service/http.service';
import { ImageResult } from 'src/app/share/picture/picture-manage/pictureManageResult';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';
import { NewsModelResponseData, NewsResponseData, NewModel } from 'src/app/core/api/models';

@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.css'],
})
export class AddComponent {
  uploadata: NewModel = {
    id: null,
    title: '',
    introduction: '',
    classification: '',
    date: new Date().toISOString(),
    status: true,
    newContent: '',
  };
  editId: string = '';
  gethtml: SafeHtml = '';
  isFinish: boolean = false;

  constructor(
    private router: Router,
    private http: HttpService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
  ) {
    route.paramMap.subscribe((x) => {
      if (x.get('id')) {
        this.isFinish = true;
        this.editId = x.get('id')!;
        this.http
          .get<NewsModelResponseData>(
            `${environment.apiUrl}News/PreviewNew/${this.editId}`,
          )
          .subscribe((newsData) => {
            this.uploadata.title = newsData.data?.title ?? '';
            this.uploadata.classification = newsData.data?.classification ?? '';
            this.uploadata.date = newsData.data?.date
              ? new Date(newsData.data.date).toISOString()
              : new Date().toISOString();
            this.uploadata.status = newsData.data?.status ?? true;
            this.uploadata.introduction = newsData.data?.introduction ?? '';
            this.gethtml = newsData.data?.newContent ?? '';
            this.uploadata.newContent = newsData.data?.newContent ?? '';
            this.uploadata.id = this.editId;
            this.isFinish = false;
          });
      }
    });
  }

  // 開啟彈窗
  OpenModal() {
    const modal = document.getElementById('myModal');
    modal!.classList.add('show');
    document.body.style.overflow = 'hidden'; // 防止背景滾動
  }

  CloseModal() {
    const modal = document.getElementById('myModal');
    modal!.classList.remove('show');
    document.body.style.overflow = '';
  }

  Cancel() {
    if (confirm('是否確定取消')) {
      this.router.navigate([`main/news/manage`]);
    }
  }

  SaveDraft() {
    if (!confirm('是否存檔')) {
      return;
    }

    this.isFinish = true;
    if (
      this.uploadata.title == '' ||
      this.uploadata.classification == '' ||
      this.uploadata.classification == '請選擇分類' ||
      this.uploadata.newContent == ''
    ) {
      alert('資料未填寫完整');
      this.isFinish = false;
      return;
    }
    const postData = {
      ...this.uploadata,
      id: this.uploadata.id || null,
    };

    this.http
      .postForm<NewsResponseData>(
        `${environment.apiUrl}News/CreateNews`,
        postData,
      )
      .subscribe((x) => {
        this.isFinish = false;
        this.router.navigate([`main/news/manage`]);
      });
  }

  GetImageUrl($event: ImageResult) {
    const imgBase64 = $event.base64URL;
    navigator.clipboard.writeText(imgBase64);
  }
}
