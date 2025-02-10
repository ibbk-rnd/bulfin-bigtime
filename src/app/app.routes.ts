import { Routes } from '@angular/router';
import { IndexComponent } from './index/index.component';
import { PageComponent } from './page/page.component';

export const routes: Routes = [
  { path: '', component: IndexComponent },
  { path: 'about', component: PageComponent },
];
