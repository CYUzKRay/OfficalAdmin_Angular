import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NewspageRoutingModule } from './newspage-routing.module';
import { NewspageComponent } from './newspage.component';
import { ManageComponent } from './manage/manage.component';
import { AddComponent } from './add/add.component';
import { ShareModule } from 'src/app/share/share.module';
import { PreviewComponent } from './preview/preview.component';

@NgModule({
  declarations: [NewspageComponent, ManageComponent, AddComponent, PreviewComponent],
  imports: [CommonModule, NewspageRoutingModule, ShareModule],
})
export class NewspageModule {}
