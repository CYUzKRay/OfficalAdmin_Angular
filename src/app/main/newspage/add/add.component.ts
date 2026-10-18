import { ActivatedRoute, Router } from '@angular/router';
import { Component } from '@angular/core';
import { HttpService } from 'src/app/share/service/http.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';
import {
  NewsModelResponseData,
  NewsResponseData,
  NewModel,
  NewsProductModel,
  ProductSearchResModel,
  ProductPaginationModelResponseData,
} from 'src/app/core/api/models';

@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.css'],
})
export class AddComponent {
  uploadata: NewModel = {
    id: null,
    title: '',
    introduction: '',
    classification: '',
    date: new Date().toISOString(),
    status: true,
    newContent: '',
  };
  editId: string = '';

  // ── 內頁底部的推薦產品 ──
  /** 已選的推薦產品,陣列順序就是官網顯示順序 */
  recommendedProducts: NewsProductModel[] = [];
  isProductModalOpen = false;
  /** 選擇彈窗用的全部產品,第一次開彈窗才載入 */
  allProducts: ProductSearchResModel[] = [];
  productKeyword = '';
  /** 彈窗裡勾選中的產品 Id,按確定才寫回 recommendedProducts */
  pendingProductIds: string[] = [];
  gethtml: SafeHtml = '';
  isFinish: boolean = false;

  constructor(
    private router: Router,
    private http: HttpService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
  ) {
    route.paramMap.subscribe((x) => {
      if (x.get('id')) {
        this.isFinish = true;
        this.editId = x.get('id')!;
        this.http
          .get<NewsModelResponseData>(
            `${environment.apiUrl}News/PreviewNew/${this.editId}`,
          )
          .subscribe((newsData) => {
            this.uploadata.title = newsData.data?.title ?? '';
            this.uploadata.classification = newsData.data?.classification ?? '';
            this.uploadata.date = newsData.data?.date
              ? new Date(newsData.data.date).toISOString()
              : new Date().toISOString();
            this.uploadata.status = newsData.data?.status ?? true;
            this.uploadata.introduction = newsData.data?.introduction ?? '';
            this.gethtml = newsData.data?.newContent ?? '';
            this.uploadata.newContent = newsData.data?.newContent ?? '';
            this.uploadata.id = this.editId;
            this.recommendedProducts = newsData.data?.products ?? [];
            this.isFinish = false;
          });
      }
    });
  }

  // 開啟彈窗
  OpenModal() {
    const modal = document.getElementById('myModal');
    modal!.classList.add('show');
    document.body.style.overflow = 'hidden'; // 防止背景滾動
  }

  CloseModal() {
    const modal = document.getElementById('myModal');
    modal!.classList.remove('show');
    document.body.style.overflow = '';
  }

  Cancel() {
    if (confirm('是否確定取消')) {
      this.router.navigate([`main/news/manage`]);
    }
  }

  SaveDraft() {
    if (!confirm('是否存檔')) {
      return;
    }

    this.isFinish = true;
    if (
      this.uploadata.title == '' ||
      this.uploadata.classification == '' ||
      this.uploadata.classification == '請選擇分類' ||
      this.uploadata.newContent == ''
    ) {
      alert('資料未填寫完整');
      this.isFinish = false;
      return;
    }
    const postData = {
      ...this.uploadata,
      id: this.uploadata.id || null,
      productIds: this.recommendedProducts
        .map((p) => p.productId)
        .filter((id): id is string => !!id),
    };

    this.http
      .postForm<NewsResponseData>(
        `${environment.apiUrl}News/CreateNews`,
        postData,
      )
      .subscribe((x) => {
        this.isFinish = false;
        this.router.navigate([`main/news/manage`]);
      });
  }

  // ================= 推薦產品 =================
  openProductModal() {
    this.pendingProductIds = this.recommendedProducts
      .map((p) => p.productId)
      .filter((id): id is string => !!id);
    this.productKeyword = '';
    this.isProductModalOpen = true;
    if (this.allProducts.length === 0) {
      this.http
        .get<ProductPaginationModelResponseData>(environment.apiUrl + 'Product/GetProducts', {
          pageIndex: 0,
          pageSize: 1000,
        })
        .subscribe((res) => {
          this.allProducts = res.data?.productList ?? [];
        });
    }
  }

  /** 依名稱或分類篩選;已勾選的排前面,方便確認 */
  get filteredProducts(): ProductSearchResModel[] {
    const keyword = this.productKeyword.trim().toLowerCase();
    return this.allProducts
      .filter(
        (p) =>
          !keyword ||
          (p.productName ?? '').toLowerCase().includes(keyword) ||
          (p.categoryName ?? '').toLowerCase().includes(keyword),
      )
      .sort((a, b) => Number(this.isPending(b)) - Number(this.isPending(a)));
  }

  isPending(product: ProductSearchResModel): boolean {
    return !!product.productId && this.pendingProductIds.includes(product.productId);
  }

  togglePending(product: ProductSearchResModel, checked: boolean) {
    const id = product.productId;
    if (!id) return;
    // 新勾的接在最後,保留原本已排好的順序
    this.pendingProductIds = checked
      ? [...this.pendingProductIds, id]
      : this.pendingProductIds.filter((x) => x !== id);
  }

  confirmProducts() {
    const existing = new Map(this.recommendedProducts.map((p) => [p.productId, p]));
    const byId = new Map(this.allProducts.map((p) => [p.productId, p]));
    this.recommendedProducts = this.pendingProductIds.map((id) => {
      const kept = existing.get(id);
      if (kept) return kept;
      const p = byId.get(id)!;
      return {
        productId: p.productId,
        productName: p.productName,
        categoryName: p.categoryName,
        coverURL: p.coverURL,
        isActive: p.isActive,
      };
    });
    this.isProductModalOpen = false;
  }

  moveProduct(index: number, step: -1 | 1) {
    const target = index + step;
    if (target < 0 || target >= this.recommendedProducts.length) return;
    const list = [...this.recommendedProducts];
    [list[index], list[target]] = [list[target], list[index]];
    this.recommendedProducts = list;
  }

  removeProduct(index: number) {
    this.recommendedProducts = this.recommendedProducts.filter((_, i) => i !== index);
  }

  GetImageUrl(imageUrl: string) {
    navigator.clipboard.writeText(imageUrl).then(() => {
      alert('已複製圖片網址！請在編輯器中「插入圖片」並貼上。');
    });
  }
}
