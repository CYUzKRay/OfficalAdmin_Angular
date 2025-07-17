import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.css'],
})
export class AddComponent {
  @ViewChild('file') fileInput!: ElementRef;
  selectedImageUrl: any;
  constructor(private route: Router) {}

  Change() {
    this.route.navigate(['main/home/preview']);
  }
  OpenFileUpload() {
    this.fileInput.nativeElement.click();
  }
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        this.selectedImageUrl = e.target.result;
        console.log(this.selectedImageUrl);
      };

      reader.readAsDataURL(file);
      console.log('選擇的檔案:', file);
      // 處理檔案上傳邏輯
    }
  }
}
