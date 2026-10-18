import {
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { HttpService } from '../../service/http.service';
import { environment } from 'src/environments/environment';
import {
  S3PictureModel,
  StringIReadOnlyListResponseData,
  ImagePaginationModelResponseData,
} from 'src/app/core/api/models';

export interface awsImageUploadContent {
  title: string;
  image: Blob | null;
}

@Component({
  selector: 'app-picture-manage',
  templateUrl: './picture-manage.component.html',
  styleUrls: ['./picture-manage.component.css'],
})
export class PictureManageComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInputRef!: ElementRef;
  @Output() imageUpload = new EventEmitter<awsImageUploadContent>();
  @Output() error = new EventEmitter<string>();
  @Output() imageUrlResult = new EventEmitter<string>();

  orginialimage: Blob | null = null;
  title: string | null = null;
  photos: any[] = [];
  selectDirectory: string = '';
  directories: string[] = [];
  images: S3PictureModel[] = [];
  selectImagesDirectory: string = '';
  selectImages: S3PictureModel[] = [];

  pageIndex = 0;
  pageSize = 20;
  totalCount = 0;

  /** 上傳進行中。按鈕轉圈並 disabled,避免同一張圖被連點送出好幾次 */
  isUploading = false;

  /** 右下角提示訊息。空字串代表不顯示 */
  toastMessage = '';
  toastIsError = false;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private http: HttpService) {}

  ngOnInit(): void {
    this.http
      .get<StringIReadOnlyListResponseData>(`${environment.apiUrl}S3/directories`)
      .subscribe((x) => {
        this.directories = x.data ?? [];
        this.selectDirectory = this.directories[0] ?? '';
      });

    this.loadImages();
  }

  loadImages() {
    this.http
      .get<ImagePaginationModelResponseData>(
        `${environment.apiUrl}S3/images`,
        {
          directory: this.selectImagesDirectory === '/' ? '' : this.selectImagesDirectory,
          pageIndex: this.pageIndex,
          pageSize: this.pageSize
        }
      )
      .subscribe((x) => {
        if (x.data) {
          this.selectImages = x.data.images ?? [];
          this.totalCount = x.data.totalCount ?? 0;
        }
      });
  }

  changePhotos() {
    this.pageIndex = 0;
    this.loadImages();
  }

  // 後端回傳的已是 CloudFront 永久網址,可直接寫進內文,不需要再轉 base64
  copyPhotoUrl(photo: S3PictureModel) {
    this.imageUrlResult.emit(photo.url!);
  }

  deletePhoto(photo: S3PictureModel) {
    var imageKey = (photo.directories ?? '') + (photo.imageName ?? '');
    var smallImageKey = (photo.directories ?? '') + (photo.smallImageName ?? '');
    this.http
      .delete(
        `${environment.apiUrl}S3/deleteImages?imageKey=${imageKey}&smallImageKey=${smallImageKey}`
      )
      .subscribe((res) => {
        this.loadImages();
      });
  }

  triggerFileUpload() {
    // console.log(this.selectDirectory);
    if (
      this.title == null ||
      this.orginialimage == null ||
      this.selectDirectory == ''
    ) {
      alert('尚有資料未齊全');
      return;
    }
    // const result: awsImageUploadContent = {
    //   title: this.title,
    //   image: this.orginialimage,
    // };
    // this.imageUpload.emit(result);
    let formdata = new FormData();
    formdata.append('title', this.title);
    formdata.append('directory', this.selectDirectory);
    formdata.append('image', this.orginialimage);

    this.isUploading = true;
    this.http
      .postForm(`${environment.apiUrl}Picture/CreatePicture`, formdata)
      .subscribe({
        next: () => {
          // 後端是 return Ok() 空回應,沒有 Response 外層,所以沒有 isSuccess 可檢查 ——
          // 走到 next 就代表 HTTP 2xx,就是成功
          this.isUploading = false;
          this.showToast('上傳成功');
          this.resetUploadForm();
          // 重讀圖庫,新上傳的圖才會出現在下面的列表
          this.loadImages();
        },
        error: () => {
          this.isUploading = false;
          this.showToast('上傳失敗,請稍後再試。', true);
        },
      });
  }

  /**
   * 清掉上傳區,讓它回到「待上傳」的樣子。
   *
   * 預覽區是 onFileSelected 直接改 innerHTML 做出來的(既有寫法),
   * 所以這裡也只能用同樣的方式還原。
   */
  private resetUploadForm() {
    this.title = null;
    this.orginialimage = null;
    this.photos = [];

    const previewArea = document.getElementById('previewArea');
    if (previewArea) {
      previewArea.style.width = '';
      previewArea.innerHTML = '<div class="preview-placeholder">待上傳預覽圖</div>';
      previewArea.classList.remove('has-image');
    }

    // file input 的 value 要清掉,否則**再選同一個檔案不會觸發 change**,
    // 使用者會以為選取失效
    if (this.fileInputRef) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  /** 右下角提示,三秒後自動消失。樣式(.toast / .toast.show)本來就在 css 裡,只是沒人用 */
  private showToast(message: string, isError = false) {
    this.toastMessage = message;
    this.toastIsError = isError;

    if (this.toastTimer !== null) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
      this.toastTimer = null;
    }, 3000);
  }

  uploadPreviewImage() {
    this.fileInputRef.nativeElement.click();
  }

  // 文件選擇處理
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // 驗證文件類型
    if (!file.type.startsWith('image/')) {
      this.error.emit('請選擇圖片檔案！');
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      this.error.emit('讀取檔案時發生錯誤！');
    };

    reader.onload = (e: any) => {
      const previewArea = document.getElementById('previewArea');
      previewArea!.style.width = '20%';
      previewArea!.innerHTML = `<img src="${e.target.result}" class="preview-image" style="max-width:100%" alt="預覽">`;
      previewArea!.classList.add('has-image');
      this.photos.push(e.target.result);
      this.orginialimage = this.base64ToBlob(e.target.result);
      // console.log(this.photos);
    };
    reader.readAsDataURL(file);
  }

  deleteSelected() {}

  ngOnDestroy(): void {
    if (this.toastTimer !== null) {
      clearTimeout(this.toastTimer);
    }
  }

  base64ToBlob(base64: string) {
    const parts = base64.split(',');
    const mime = parts[0].match(/:(.*?);/)![1]; // e.g. "image/png"
    const binary = atob(parts[1]); // 解碼
    let length = binary.length;
    const u8arr = new Uint8Array(length);

    while (length--) {
      u8arr[length] = binary.charCodeAt(length);
    }
    return new Blob([u8arr], { type: mime });
  }
}
