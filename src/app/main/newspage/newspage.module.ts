import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NewspageRoutingModule } from './newspage-routing.module';
import { NewspageComponent } from './newspage.component';
import { ManageComponent } from './manage/manage.component';
import { AddComponent } from './add/add.component';


@NgModule({
  declarations: [
    NewspageComponent,
    ManageComponent,
    AddComponent
  ],
  imports: [
    CommonModule,
    NewspageRoutingModule
  ]
})
export class NewspageModule { }
