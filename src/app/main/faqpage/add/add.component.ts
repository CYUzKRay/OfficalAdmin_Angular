import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { HttpService } from 'src/app/share/service/http.service';
import { environment } from 'src/environments/environment';

export interface CreateFaqModel {
  id: string | null;
  question: string;
  answer: string;
  status: boolean;
}

export interface FaqModelResponseData {
  data?: CreateFaqModel;
}

@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.css']
})
export class AddComponent implements OnInit {
  uploadata: CreateFaqModel = {
    id: null,
    question: '',
    answer: '',
    status: true
  };
  editId: string = '';
  isFinish: boolean = false;

  constructor(
    private router: Router,
    private http: HttpService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((x) => {
      if (x.get('id')) {
        this.isFinish = true;
        this.editId = x.get('id')!;
        this.http
          .get<FaqModelResponseData>(`${environment.apiUrl}Faq/Preview/${this.editId}`)
          .subscribe((faqData) => {
            if (faqData.data) {
              this.uploadata.question = faqData.data.question ?? '';
              this.uploadata.answer = faqData.data.answer ?? '';
              this.uploadata.status = faqData.data.status ?? true;
              this.uploadata.id = this.editId;
            }
            this.isFinish = false;
          });
      }
    });
  }

  // 開啟彈窗
  OpenModal() {
    const modal = document.getElementById('myModal');
    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden'; // 防止背景滾動
    }
  }

  CloseModal() {
    const modal = document.getElementById('myModal');
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  Cancel() {
    if (confirm('是否確定取消？')) {
      this.router.navigate([`main/faq/manage`]);
    }
  }

  SaveDraft() {
    if (!confirm('是否確定儲存？')) {
      return;
    }

    if (!this.uploadata.question || !this.uploadata.answer) {
      alert('資料未填寫完整（標題與回答皆必填）');
      return;
    }

    this.isFinish = true;
    const postData = {
      ...this.uploadata,
      id: this.uploadata.id || null
    };

    // 依照 swagger 描述，使用 JSON 傳遞
    this.http
      .postJson<any>(`${environment.apiUrl}Faq/CreateFaq`, postData)
      .subscribe(() => {
        this.isFinish = false;
        this.router.navigate([`main/faq/manage`]);
      });
  }

  GetImageUrl(imageUrl: string) {
    navigator.clipboard.writeText(imageUrl).then(() => {
      alert('已複製圖片網址！請在編輯器中「插入圖片」並貼上。');
      this.CloseModal();
    });
  }
}
