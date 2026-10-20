import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CropResult } from 'src/app/share/image-cropper/image-cropper.component';
import { HttpService } from 'src/app/share/service/http.service';
import { environment } from 'src/environments/environment';
import {
  HomeCarouselResponseData,
  SearchHomeCarouselModelListResponseData,
} from 'src/app/core/api/models';

@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.css'],
})
export class AddComponent implements OnInit {
  @ViewChild('file') fileInput!: ElementRef;
  @ViewChild('carouselPreview') carouselPreview!: ElementRef;
  selectedImageUrl: any = '';
  showPreview: boolean = false;
  uploadData = {
    title: '',
    url: '',
    pictureStatus: true,
    /** 編輯時為 null 代表沿用原本的圖 */
    picture: null as Blob | null,
  };

  /** 編輯中的輪播圖 Id;新增時為 null */
  editId: string | null = null;

  /** 送出中,避免連按造成重複建立 */
  isSaving = false;
  constructor(
    private route: Router,
    private http: HttpService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.editId = this.activatedRoute.snapshot.paramMap.get('id');
    if (this.editId) {
      this.loadCarousel(this.editId);
    }
  }

  /** 後端沒有單筆查詢,從列表找;輪播圖只有幾筆,不需要另開端點 */
  private loadCarousel(id: string) {
    this.http
      .get<SearchHomeCarouselModelListResponseData>(
        `${environment.apiUrl}Carousel/SearchCarouselPictures`
      )
      .subscribe({
        next: (res) => {
          const target = (res.data ?? []).find((x) => x.id === id);
          if (!target) {
            alert('找不到這張輪播圖,可能已被刪除');
            this.route.navigate(['/main/home/manage']);
            return;
          }
          this.uploadData.title = target.title ?? '';
          this.uploadData.url = target.url ?? '';
          this.uploadData.pictureStatus = target.status ?? true;
          this.selectedImageUrl = target.image ?? '';
        },
        error: () => alert('讀取輪播圖失敗,請稍後再試。'),
      });
  }

  deviceTemplate = [
    {
      name: '桌面版',
      icon: 'fa-desktop',
      active: true,
      width: '100%',
      height: '300px',
    },
    {
      name: '平板',
      icon: 'fa-tablet-alt',
      active: false,
      width: '80%',
      height: '240px',
    },
    {
      name: '手機',
      icon: 'fa-mobile-alt',
      active: false,
      width: '50%',
      height: '150px',
    },
  ];

  Change() {
    this.showPreview = true;
  }
  OpenFileUpload() {
    this.fileInput.nativeElement.click();
  }
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.uploadData.picture = file;
      const reader = new FileReader();

      reader.onload = (e: any) => {
        this.selectedImageUrl = e.target.result;
        console.log(this.selectedImageUrl);
      };

      reader.readAsDataURL(file);
      // console.log('選擇的檔案:', file);
      // 處理檔案上傳邏輯
    }
  }

  ImageUploaded(imageUrl: string) {
    this.selectedImageUrl = imageUrl;
  }

  PreviewImage($event: CropResult) {
    // console.log($event);
    this.selectedImageUrl = $event.cropped;
    this.uploadData.picture = $event.cropImage;
  }

  PreviewTelplate(device: any) {
    this.deviceTemplate.forEach((x) => {
      x.active = false;
    });
    device.active = true;
    this.carouselPreview.nativeElement.style.height = device.height;
    this.carouselPreview.nativeElement.style.width = device.width;
  }

  Save() {
    if (this.isSaving) {
      return;
    }
    if (!this.uploadData.title) {
      alert('請填寫標題');
      return;
    }
    // 編輯時可以不換圖;新增一定要有圖
    if (!this.editId && !this.uploadData.picture) {
      alert('請先選擇圖片');
      return;
    }
    let formData = new FormData();
    formData.append('title', this.uploadData.title);
    formData.append('url', this.uploadData.url);
    formData.append('status', this.uploadData.pictureStatus ? 'true' : 'false');
    if (this.uploadData.picture) {
      formData.append('picture', this.uploadData.picture);
    }

    let request$;
    if (this.editId) {
      formData.append('id', this.editId);
      request$ = this.http.putForm<HomeCarouselResponseData>(
        `${environment.apiUrl}Carousel/EditCarousel`,
        formData
      );
    } else {
      request$ = this.http.postForm<HomeCarouselResponseData>(
        `${environment.apiUrl}Carousel/CreateCarouselPictures`,
        formData
      );
    }

    this.isSaving = true;
    request$.subscribe({
      next: () => {
        this.isSaving = false;
        alert('儲存成功');
        this.route.navigate(['/main/home/manage']);
      },
      // 原本只有成功回呼 —— 後端回 400(例如圖片超過 10MB)時畫面完全沒反應,
      // 看起來就像「送不出去」。錯誤一定要讓操作者看到。
      error: (err) => {
        this.isSaving = false;
        alert(err?.error?.message ?? '儲存失敗,請稍後再試。');
      },
    });
  }
}
