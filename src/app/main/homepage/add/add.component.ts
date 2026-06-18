import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CropResult } from 'src/app/share/image-cropper/image-cropper.component';
import { HttpService } from 'src/app/share/service/http.service';

@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.css'],
})
export class AddComponent {
  @ViewChild('file') fileInput!: ElementRef;
  @ViewChild('carouselPreview') carouselPreview!: ElementRef;
  selectedImageUrl: any;
  uploadData = {
    title: '',
    url: '',
    pictureStatus: true,
    picture: null as Blob | null,
  };
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
    this.route.navigate(['main/home/preview']);
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
    if (!this.uploadData.picture) {
      alert('請先選擇圖片');
      return;
    }
    let formData = new FormData();
    formData.append('title', this.uploadData.title);
    formData.append('url', this.uploadData.url);
    formData.append('status', this.uploadData.pictureStatus ? 'true' : 'false');
    formData.append('picture', this.uploadData.picture);

    this.http
      .postForm(
        'http://localhost:5133/api/Carousel/CreateCarouselPictures',
        formData
      )
      .subscribe((x) => {});
  }
}
