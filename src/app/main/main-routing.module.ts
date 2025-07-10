import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main.component';
import { HomepageComponent } from './homepage/homepage.component';

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        loadChildren: () =>
          import('./homepage/homepage.module').then((m) => m.HomepageModule),
      },
      {
        path: 'news',
        loadChildren: () =>
          import('./newspage/newspage.module').then((m) => m.NewspageModule),
      },
      {
        path: 'product',
        loadChildren: () =>
          import('./productpage/productpage.module').then(
            (m) => m.ProductpageModule
          ),
      },
      {
        path: 'faq',
        loadChildren: () =>
          import('./faqpage/faqpage.module').then((m) => m.FaqpageModule),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MainRoutingModule {}
