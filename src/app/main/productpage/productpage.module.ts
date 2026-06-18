import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductpageRoutingModule } from './productpage-routing.module';
import { ProductpageComponent } from './productpage.component';
import { ManageComponent } from './manage/manage.component';
import { AddComponent } from './add/add.component';
import { ShareModule } from 'src/app/share/share.module';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [ProductpageComponent, ManageComponent, AddComponent],
  imports: [
    CommonModule,
    ProductpageRoutingModule,
    ShareModule,
    DragDropModule,
  ],
})
export class ProductpageModule {}
