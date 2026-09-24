import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from 'src/app/share/service/http.service';
import { SitePublishService } from 'src/app/share/service/site-publish.service';
import { environment } from 'src/environments/environment';
import {
  SearchHomeCarouselModel,
  SearchHomeCarouselModelListResponseData,
  HomeCarouselResponseData,
  Response as ApiResponse,
  ProductSearchResModel,
  ProductPaginationModelResponseData,
} from 'src/app/core/api/models';

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.css'],
})
export class ManageComponent implements OnInit {
  constructor(private route: Router, private http: HttpService,
    private sitePublish: SitePublishService,
  ) {}

  carousels: SearchHomeCarouselModel[] = [];
  
  isRecommendModalOpen = false;
  allProducts: ProductSearchResModel[] = [];
  recommendedProducts: ProductSearchResModel[] = [];
  pendingRecommendedProducts: ProductSearchResModel[] = [];

  ngOnInit(): void {
    this.searchCarousel();
    this.loadRecommendedProducts();
  }

  loadRecommendedProducts() {
    this.http.get<any>(`${environment.apiUrl}Product/GetRecommendedProducts`)
      .subscribe(res => {
        if (res.data) {
          this.recommendedProducts = res.data;
        }
      });
  }

  searchCarousel() {
    this.http
      .get<SearchHomeCarouselModelListResponseData>(
        `${environment.apiUrl}Carousel/SearchCarouselPictures`
      )
      .subscribe((x) => {
        this.carousels = x.data ?? [];
      });
  }

  deleteCarousel(targetCarousel: SearchHomeCarouselModel) {
    this.http
      .delete<HomeCarouselResponseData>(
        `${environment.apiUrl}Carousel/DeleteCarousel`,
        {
          carouselId: targetCarousel.id,
        }
      )
      .subscribe((x) => {
        this.carousels = this.carousels.filter(
          (x) => x.id != targetCarousel.id
        );
      });
  }

  editCarouselSort(direction: string, carousel: SearchHomeCarouselModel) {
    this.http
      .put<ApiResponse>(
        `${environment.apiUrl}Carousel/EditPictureSort/${direction}`,
        carousel
      )
      .subscribe((x) => {
        this.searchCarousel();
      });
  }

  changeCarouselStatus(carousel: SearchHomeCarouselModel) {
    this.http
      .put<ApiResponse>(
        `${environment.apiUrl}Carousel/EditCarouselStatus/${carousel.id}`,
        null
      )
      .subscribe((x) => {
        carousel.status = !carousel.status;
      });
  }

  // ================= 推薦商品管理 =================
  openRecommendModal() {
    this.pendingRecommendedProducts = [...this.recommendedProducts];
    this.isRecommendModalOpen = true;
    if (this.allProducts.length === 0) {
      this.http.get<ProductPaginationModelResponseData>(`${environment.apiUrl}Product/GetProducts`, { pageIndex: 0, pageSize: 100 })
        .subscribe(res => {
          this.allProducts = res.data?.productList || [];
        });
    }
  }

  get sortedAllProducts(): ProductSearchResModel[] {
    return [...this.allProducts].sort((a, b) => {
      const aSelected = this.isProductSelected(a);
      const bSelected = this.isProductSelected(b);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }

  isProductSelected(product: ProductSearchResModel): boolean {
    return this.pendingRecommendedProducts.some(p => p.productId === product.productId);
  }

  toggleProductSelection(product: ProductSearchResModel, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      if (this.pendingRecommendedProducts.length >= 3) {
        alert('無法添加，推薦商品最多只能三項，請先將其他商品取消勾選。');
        (event.target as HTMLInputElement).checked = false;
        return;
      }
      this.pendingRecommendedProducts.push(product);
    } else {
      this.pendingRecommendedProducts = this.pendingRecommendedProducts.filter(p => p.productId !== product.productId);
    }
  }

  confirmRecommendSelection() {
    this.recommendedProducts = [...this.pendingRecommendedProducts];
    // 新增是一次性動作,存完直接發布
    this.saveRecommendedProducts(true);
  }

  removeRecommend(product: ProductSearchResModel) {
    this.recommendedProducts = this.recommendedProducts.filter(p => p.productId !== product.productId);
    this.saveRecommendedProducts(true);
  }

  moveRecommendUp(index: number) {
    if (index > 0) {
      const temp = this.recommendedProducts[index];
      this.recommendedProducts[index] = this.recommendedProducts[index - 1];
      this.recommendedProducts[index - 1] = temp;
      this.saveRecommendedProducts();
    }
  }

  moveRecommendDown(index: number) {
    if (index < this.recommendedProducts.length - 1) {
      const temp = this.recommendedProducts[index];
      this.recommendedProducts[index] = this.recommendedProducts[index + 1];
      this.recommendedProducts[index + 1] = temp;
      this.saveRecommendedProducts();
    }
  }

  /**
   * 儲存推薦商品清單(新增 / 移除 / 排序都走這一支)。
   *
   * 後端這支已改為**延後發布** —— 排序會連按好幾次,每次都重產整站太吵。
   * 所以由呼叫端決定要不要接著發布:
   * - 新增、移除:一次性動作,存完就發布(`publishNow = true`)
   * - 排序:留待操作者按「送出並更新官網」
   */
  saveRecommendedProducts(publishNow = false) {
    const productIds = this.recommendedProducts.map(p => p.productId);
    this.http.put<ApiResponse>(`${environment.apiUrl}Product/UpdateRecommendedProducts`, { productIds })
      .subscribe({
        next: res => {
          if (!res.isSuccess) {
            alert(res.message || '儲存推薦商品失敗');
            return;
          }
          this.isRecommendModalOpen = false;

          if (publishNow) {
            this.sitePublish.publish().subscribe({ error: () => {} });
          } else {
            // 待發布的標記由後端記錄,重讀狀態把它拿回來
            this.sitePublish.refresh();
          }
        },
        error: () => alert('儲存推薦商品失敗,請稍後再試。'),
      });
  }
}
