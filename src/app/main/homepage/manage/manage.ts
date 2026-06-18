import { DecimalPipe } from '@angular/common';

export interface HomePageManage {
  index: number;
  id: string;
  title: string;
  image: string;
  url: string;
  status: Boolean;
  orders: number;
}
