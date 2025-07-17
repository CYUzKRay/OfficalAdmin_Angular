import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomepageRoutingModule } from './homepage-routing.module';
import { HomepageComponent } from './homepage.component';
import { AddComponent } from './add/add.component';
import { ManageComponent } from './manage/manage.component';
import { PreviewEffectComponent } from './preview-effect/preview-effect.component';
import { ShareModule } from 'src/app/share/share.module';

@NgModule({
  declarations: [
    HomepageComponent,
    AddComponent,
    ManageComponent,
    PreviewEffectComponent,
  ],
  imports: [CommonModule, HomepageRoutingModule, ShareModule],
})
export class HomepageModule {}
