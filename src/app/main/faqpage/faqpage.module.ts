import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FaqpageRoutingModule } from './faqpage-routing.module';
import { FaqpageComponent } from './faqpage.component';
import { ManageComponent } from './manage/manage.component';
import { AddComponent } from './add/add.component';
import { ShareModule } from 'src/app/share/share.module';


@NgModule({
  declarations: [
    FaqpageComponent,
    ManageComponent,
    AddComponent
  ],
  imports: [
    CommonModule,
    FaqpageRoutingModule,
    ShareModule
  ]
})
export class FaqpageModule { }
