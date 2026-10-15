import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from 'src/app/share/service/http.service';
import { SitePublishService } from 'src/app/share/service/site-publish.service';
import { SortLockService } from 'src/app/share/service/sort-lock.service';
import { environment } from 'src/environments/environment';
import { CropResult } from 'src/app/share/image-cropper/image-cropper.component';
import {
  SearchHomeCarouselModel,
  SearchHomeCarouselModelListResponseData,
  SearchHomeApplicationModel,
  SearchHomeApplicationModelListResponseData,
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
    /** 模板要讀 isBusy / isBusyKey,所以是 public */
    public sortLock: SortLockService,
  ) {}

  carousels: SearchHomeCarouselModel[] = [];

  applications: SearchHomeApplicationModel[] = [];
  isApplicationModalOpen = false;
  /** 送出中,避免連按造成重複建立 */
  isSavingApplication = false;
  /** 正在編輯的那一筆;null 代表新增 */
  editingApplication: SearchHomeApplicationModel | null = null;
  applicationForm = {
    titleEn: '',
    title: '',
    description: '',
    status: true,
    /** 新選的背景圖;編輯時沒換圖就保持 null,後端沿用原圖 */
    picture: null as Blob | null,
  };
  /** 彈窗裡的背景圖預覽:新選的圖,或編輯時的原圖 */
  applicationPreview: string | null = null;
  
  isRecommendModalOpen = false;
  allProducts: ProductSearchResModel[] = [];
  recommendedProducts: ProductSearchResModel[] = [];
  pendingRecommendedProducts: ProductSearchResModel[] = [];

  ngOnInit(): void {
    this.searchCarousel();
    this.searchApplications();
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
        // 內容異動會讓後端自動排入整站重新發布,重讀狀態讓 navbar 立刻反映
        this.sitePublish.refresh();
        this.carousels = this.carousels.filter(
          (x) => x.id != targetCarousel.id
        );
      });
  }

  editCarouselSort(direction: string, carousel: SearchHomeCarouselModel) {
    this.sortLock
      .run(
        `carousel:${carousel.id}:${direction}`,
        this.http.put<ApiResponse>(
          `${environment.apiUrl}Carousel/EditPictureSort/${direction}`,
          carousel
        )
      )
      .subscribe({
        next: (res) => {
          // 已在最前/最後是 HTTP 200 + isSuccess false,不是錯誤
          if (res?.isSuccess === false) {
            alert(res.message ?? '無法再移動');
            return;
          }
          // 排序是延後發布,待發布標記由後端記錄,重讀狀態把它拿回來
          this.sitePublish.refresh();
          this.searchCarousel();
        },
        error: (err) => alert(SortLockService.message(err)),
      });
  }

  changeCarouselStatus(carousel: SearchHomeCarouselModel) {
    this.http
      .put<ApiResponse>(
        `${environment.apiUrl}Carousel/EditCarouselStatus/${carousel.id}`,
        null
      )
      .subscribe((x) => {
        // 內容異動會讓後端自動排入整站重新發布,重讀狀態讓 navbar 立刻反映
        this.sitePublish.refresh();
        carousel.status = !carousel.status;
      });
  }

  // ================= 應用領域管理 =================
  searchApplications() {
    this.http
      .get<SearchHomeApplicationModelListResponseData>(
        `${environment.apiUrl}Application/SearchApplications`
      )
      .subscribe((x) => {
        this.applications = x.data ?? [];
      });
  }

  /** 不帶參數是新增,帶一筆是編輯 */
  openApplicationModal(application?: SearchHomeApplicationModel) {
    this.editingApplication = application ?? null;
    this.applicationForm = {
      titleEn: application?.titleEn ?? '',
      title: application?.title ?? '',
      description: application?.description ?? '',
      status: application?.status ?? true,
      picture: null,
    };
    this.applicationPreview = application?.image ?? null;
    this.isApplicationModalOpen = true;
  }

  onApplicationCropped(result: CropResult) {
    this.applicationPreview = result.cropped;
    this.applicationForm.picture = result.cropImage;
  }

  saveApplication() {
    if (this.isSavingApplication) {
      return;
    }
    const form = this.applicationForm;
    if (!form.titleEn.trim() || !form.title.trim()) {
      alert('請填寫英文標題與中文標題');
      return;
    }
    if (!this.editingApplication && !form.picture) {
      alert('請先選擇背景圖');
      return;
    }

    const formData = new FormData();
    formData.append('titleEn', form.titleEn.trim());
    formData.append('title', form.title.trim());
    formData.append('description', form.description.trim());
    formData.append('status', form.status ? 'true' : 'false');
    if (form.picture) {
      formData.append('picture', form.picture);
    }

    let request;
    if (this.editingApplication) {
      formData.append('id', this.editingApplication.id ?? '');
      request = this.http.putForm<ApiResponse>(
        `${environment.apiUrl}Application/EditApplication`,
        formData
      );
    } else {
      request = this.http.postForm<ApiResponse>(
        `${environment.apiUrl}Application/CreateApplication`,
        formData
      );
    }

    this.isSavingApplication = true;
    request.subscribe({
      next: () => {
        this.isSavingApplication = false;
        this.isApplicationModalOpen = false;
        // 內容異動會讓後端自動排入整站重新發布,重讀狀態讓 navbar 立刻反映
        this.sitePublish.refresh();
        this.searchApplications();
      },
      // 後端 400(圖片過大、欄位過長)的訊息一定要讓操作者看到
      error: (err) => {
        this.isSavingApplication = false;
        alert(err?.error?.message ?? '儲存失敗,請稍後再試。');
      },
    });
  }

  deleteApplication(target: SearchHomeApplicationModel) {
    this.http
      .delete<ApiResponse>(`${environment.apiUrl}Application/DeleteApplication`, {
        applicationId: target.id,
      })
      .subscribe(() => {
        this.sitePublish.refresh();
        this.applications = this.applications.filter((x) => x.id != target.id);
      });
  }

  editApplicationSort(direction: string, application: SearchHomeApplicationModel) {
    this.sortLock
      .run(
        `application:${application.id}:${direction}`,
        this.http.put<ApiResponse>(
          `${environment.apiUrl}Application/EditApplicationSort/${direction}`,
          application
        )
      )
      .subscribe({
        next: (res) => {
          // 已在最前/最後是 HTTP 200 + isSuccess false,不是錯誤
          if (res?.isSuccess === false) {
            alert(res.message ?? '無法再移動');
            return;
          }
          // 排序是延後發布,待發布標記由後端記錄,重讀狀態把它拿回來
          this.sitePublish.refresh();
          this.searchApplications();
        },
        error: (err) => alert(SortLockService.message(err)),
      });
  }

  changeApplicationStatus(application: SearchHomeApplicationModel) {
    this.http
      .put<ApiResponse>(
        `${environment.apiUrl}Application/EditApplicationStatus/${application.id}`,
        null
      )
      .subscribe(() => {
        this.sitePublish.refresh();
        application.status = !application.status;
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
      this.moveRecommend(index, index - 1, `rec:${index}:up`);
    }
  }

  moveRecommendDown(index: number) {
    if (index < this.recommendedProducts.length - 1) {
      this.moveRecommend(index, index + 1, `rec:${index}:down`);
    }
  }

  /**
   * 交換兩筆推薦商品的順序並存檔。
   *
   * 這支**先改畫面再送出**(樂觀更新),跟其他排序不同 ——
   * 其他排序是等後端回應再重讀列表,這支的順序來源就是前端這個陣列。
   *
   * 所以失敗時一律 `loadRecommendedProducts()` 重讀,而不是把陣列換回來:
   * 逾時的時候**無法判斷後端到底寫進去了沒有**,自己還原有一半機率是錯的,
   * 向後端要一次才是唯一不會猜錯的做法。
   *
   * 不共用 `saveRecommendedProducts()` 是因為那支成功後會關閉 modal,
   * 而排序不是在 modal 裡操作的。
   */
  private moveRecommend(from: number, to: number, sortKey: string) {
    const list = this.recommendedProducts;
    const temp = list[from];
    list[from] = list[to];
    list[to] = temp;

    const productIds = list.map((p) => p.productId);

    this.sortLock
      .run(
        sortKey,
        this.http.put<ApiResponse>(
          `${environment.apiUrl}Product/UpdateRecommendedProducts`,
          { productIds }
        )
      )
      .subscribe({
        next: (res) => {
          if (!res.isSuccess) {
            alert(res.message || '儲存推薦商品失敗');
            this.loadRecommendedProducts();
            return;
          }
          // 排序走延後發布:只重讀待發布標記,不立即發布整站
          this.sitePublish.refresh();
        },
        error: (err) => {
          alert(SortLockService.message(err));
          this.loadRecommendedProducts();
        },
      });
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
