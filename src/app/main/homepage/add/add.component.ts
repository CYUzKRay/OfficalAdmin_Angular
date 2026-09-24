import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CropResult } from 'src/app/share/image-cropper/image-cropper.component';
import { HttpService } from 'src/app/share/service/http.service';
import { environment } from 'src/environments/environment';
import { HomeCarouselResponseData } from 'src/app/core/api/models';

@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.css'],
})
export class AddComponent {
  @ViewChild('file') fileInput!: ElementRef;
  @ViewChild('carouselPreview') carouselPreview!: ElementRef;
  selectedImageUrl: any = '';
  showPreview: boolean = false;
  uploadData = {
    title: '',
    subTitle: '',
    url: '',
    pictureStatus: true,
    picture: null as Blob | null,
  };

  /** 送出中,避免連按造成重複建立 */
  isSaving = false;
  constructor(private route: Router, private http: HttpService) {}

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
    if (!this.uploadData.picture) {
      alert('請先選擇圖片');
      return;
    }
    let formData = new FormData();
    formData.append('title', this.uploadData.title);
    formData.append('subTitle', this.uploadData.subTitle);
    formData.append('url', this.uploadData.url);
    formData.append('status', this.uploadData.pictureStatus ? 'true' : 'false');
    formData.append('picture', this.uploadData.picture);

    this.isSaving = true;
    this.http
      .postForm<HomeCarouselResponseData>(
        `${environment.apiUrl}Carousel/CreateCarouselPictures`,
        formData
      )
      .subscribe({
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
