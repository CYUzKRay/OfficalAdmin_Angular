import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductpageComponent } from './productpage.component';
import { ManageComponent } from './manage/manage.component';
import { AddComponent } from './add/add.component';
import { SitePreviewComponent } from 'src/app/share/site-preview/site-preview.component';

const routes: Routes = [
  {
    path: '',
    component: ProductpageComponent,
    children: [
      {
        path: '',
        redirectTo: 'manage',
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
        path: 'edit/:id',
        component: AddComponent,
      },
      {
        path: 'preview/:id',
        component: SitePreviewComponent,
        data: { previewApi: 'SitePublish/PreviewProduct/', backUrl: 'main/product/manage' },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductpageRoutingModule {}
