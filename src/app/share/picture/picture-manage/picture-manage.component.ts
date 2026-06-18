import {
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { HttpService } from '../../service/http.service';
import { ResponseData } from '../../models/ResponseData';
import { environment } from 'src/environments/environment';
import {
  ImageResult,
  pictureManageResult,
  pictureManageResultContent,
} from './pictureManageResult';

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
  @Output() imageUrlResult = new EventEmitter<ImageResult>();

  orginialimage: Blob | null = null;
  title: string | null = null;
  photos: any[] = [];
  selectDirectory: string = '';
  directories: string[] = [];
  images: pictureManageResult[] = [];
  selectImagesDirectory: string = '';
  selectImages: pictureManageResultContent[] = [];

  constructor(private http: HttpService) {}

  ngOnInit(): void {
    this.http
      .get<ResponseData<string[]>>(`${environment.apiUrl}S3/directories`)
      .subscribe((x) => {
        this.directories = x.data;
        this.selectDirectory = x.data[0];
      });

    this.http
      .get<ResponseData<pictureManageResult[]>>(
        `${environment.apiUrl}S3/images`
      )
      .subscribe((x) => {
        this.images = x.data;
        let firstImage = x.data.filter((x) => x.directory == '/')[0];
        this.selectImagesDirectory = firstImage.directory;
        this.selectImages = firstImage.images;
      });
  }

  changePhotos() {
    this.selectImages = this.images.filter(
      (x) => x.directory == this.selectImagesDirectory
    )[0].images;
  }

  copyPhotoUrl(photo: pictureManageResultContent) {
    // photo.url
    this.imageUrlToBase64(photo.url).then((base64) => {
      // navigator.clipboard.writeText(base64);
      var result = new ImageResult(base64, photo.url);
      this.imageUrlResult.emit(result);
      console.log(result);
    });
  }

  imageUrlToBase64(url: string) {
    return new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; //⚠️ 必須加，否則會 CORS 報錯
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx!.drawImage(img, 0, 0);

        const base64 = canvas.toDataURL('image/png');
        resolve(base64);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  deletePhoto(photo: pictureManageResultContent) {
    var imageKey = photo.directories + photo.imageName;
    var smallImageKey = photo.directories + photo.smallImageName;
    this.http
      .delete(
        `${environment.apiUrl}S3/deleteImages?imageKey=${imageKey}&smallImageKey=${smallImageKey}`
      )
      .subscribe((res) => {
        this.selectImages = this.selectImages.filter((x) => x.url != photo.url);
        // this.images.forEach((x) => {
        //   if (x.directory == photo.directories) x.images = x.images.filter((img) => img.url != photo.url);
        // });
        // this.images[0].images = this.images[0].images.filter(
        //   (x) => x.url != photo.url
        // );

        this.images.forEach((x) => {
          if (x.directory == '/' || x.directory == photo.directories) {
            var newImages = x.images.filter((x) => x.url != photo.url);
            x.images = newImages;
            // if (x.directory == photo.directories) {
            //   this.selectImages = newImages;
            // }
          }
        });
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
