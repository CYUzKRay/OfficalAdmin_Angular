import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-preview-effect',
  templateUrl: './preview-effect.component.html',
  styleUrls: ['./preview-effect.component.css']
})
export class PreviewEffectComponent {
  @Input() previewTitle: string = '';
  @Input() previewSubTitle: string = '';
  @Input() previewUrl: string = '';
  @Input() previewImage: string = '';

  @Output() closePreview = new EventEmitter<void>();

  currentDevice: string = 'desktop'; // desktop, tablet, mobile

  setDevice(device: string) {
    this.currentDevice = device;
  }

  Close() {
    this.closePreview.emit();
  }
}
