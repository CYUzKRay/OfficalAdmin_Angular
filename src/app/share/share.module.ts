import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ImageCropperComponent } from './image-cropper/image-cropper.component';

let exportComponents = [ImageCropperComponent];

@NgModule({
  declarations: [exportComponents],
  imports: [CommonModule],
  exports: [exportComponents],
})
export class ShareModule {}
