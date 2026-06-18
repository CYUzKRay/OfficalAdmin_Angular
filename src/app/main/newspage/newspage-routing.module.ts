import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NewspageComponent } from './newspage.component';
import { ManageComponent } from './manage/manage.component';
import { AddComponent } from './add/add.component';
import { PreviewComponent } from './preview/preview.component';

const routes: Routes = [
  {
    path: '',
    component: NewspageComponent,
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
        path: 'add/:id',
        component: AddComponent,
      },
      {
        path: 'preview/:id',
        component: PreviewComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NewspageRoutingModule {}
