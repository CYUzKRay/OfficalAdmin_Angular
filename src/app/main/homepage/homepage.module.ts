import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomepageRoutingModule } from './homepage-routing.module';
import { HomepageComponent } from './homepage.component';
import { AddComponent } from './add/add.component';
import { ManageComponent } from './manage/manage.component';

@NgModule({
  declarations: [HomepageComponent, AddComponent, ManageComponent],
  imports: [CommonModule, HomepageRoutingModule],
})
export class HomepageModule {}
