import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ImageCropperComponent } from './image-cropper/image-cropper.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ɵInternalFormsSharedModule } from '@angular/forms';
import { HttpService } from './service/http.service';
import { EditorComponent } from './editor/editor.component';
import { PictureManageComponent } from './picture/picture-manage/picture-manage.component';
import { PaginationComponent } from './pagination/pagination.component';
import { LoadingComponent } from './loading/loading.component';
import { ModalComponent } from './modal/modal.component';
import { PublishPendingComponent } from './publish-pending/publish-pending.component';

let exportComponents = [
  ImageCropperComponent,
  EditorComponent,
  PictureManageComponent,
  PaginationComponent,
  LoadingComponent,
  ModalComponent,
  PublishPendingComponent,
];
let exportModules = [FormsModule, HttpClientModule];
@NgModule({
  declarations: [
    exportComponents,
    EditorComponent,
    LoadingComponent,
    ModalComponent,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    ɵInternalFormsSharedModule,
    FormsModule,
  ],
  exports: [exportComponents, exportModules],
  providers: [HttpService],
})
export class ShareModule {}
