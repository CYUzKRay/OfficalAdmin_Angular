import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductpageComponent } from './productpage.component';
import { ManageComponent } from './manage/manage.component';
import { AddComponent } from './add/add.component';

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
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductpageRoutingModule {}
