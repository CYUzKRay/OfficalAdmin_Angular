import {
  Component,
  ElementRef,
  EventEmitter,
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
export class PictureManageComponent implements OnInit {
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

    this.http
      .postForm(`${environment.apiUrl}Picture/CreatePicture`, formdata)
      .subscribe((x) => {
        console.log(x);
      });
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
