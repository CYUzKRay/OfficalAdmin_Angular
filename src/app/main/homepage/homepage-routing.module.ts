import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomepageComponent } from './homepage.component';
import { ManageComponent } from './manage/manage.component';
import { AddComponent } from './add/add.component';
import { PreviewEffectComponent } from './preview-effect/preview-effect.component';

const routes: Routes = [
  {
    path: '',
    component: HomepageComponent,
    children: [
      {
        path: '',
        redirectTo: '',
        pathMatch: 'full',
      },
      {
        path: 'manage',
        component: ManageComponent,
      },
      {
        path: 'add',
        component: AddComponent,
      },
      {
        path: 'preview',
        component: PreviewEffectComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomepageRoutingModule {}
