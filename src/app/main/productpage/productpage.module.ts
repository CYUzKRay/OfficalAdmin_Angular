import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductpageRoutingModule } from './productpage-routing.module';
import { ProductpageComponent } from './productpage.component';
import { ManageComponent } from './manage/manage.component';
import { AddComponent } from './add/add.component';


@NgModule({
  declarations: [
    ProductpageComponent,
    ManageComponent,
    AddComponent
  ],
  imports: [
    CommonModule,
    ProductpageRoutingModule
  ]
})
export class ProductpageModule { }
