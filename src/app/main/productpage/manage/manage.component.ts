import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from 'src/app/share/service/http.service';
import { environment } from 'src/environments/environment';
import {
  SearchCategoryModel,
  CategoryModel as CategoryRequestModel,
  ProductCategoryResponseData,
  SearchCategoryModelListResponseData,
  Response as ApiResponse,
  ProductSearchResModel,
  ProductPaginationModelResponseData,
} from 'src/app/core/api/models';

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.css'],
})
export class ManageComponent {
  isCategoryModalOpen: boolean = false;
  isCategorayEditing: boolean = false;
  categoryModalTitle: string = '新增主分類';
  categoryType: 'main' | 'sub' = 'main';

  newCategoryData: Partial<CategoryRequestModel> = {
    id: null,
    name: '',
    status: true,
    introduction: '',
    parentId: null,
  };

  parentCategoryId: string | null = null;
  nextLayer: boolean = true;

  mainCategory: SearchCategoryModel[] = [];
  subCategory: SearchCategoryModel[] = [];

  isEdit = false;

  // Product List State
  products: ProductSearchResModel[] = [];
  pageIndex: number = 0;
  pageSize: number = 10;
  totalCount: number = 0;
  
  // Filters
  searchKeyword: string = '';
  searchCategoryId: string | null = null;
  searchIsActive: string = 'all'; // 'all', 'active', 'inactive'

  constructor(
    private route: Router,
    private http: HttpService,
  ) {}

  ngOnInit(): void {
    this.searchCategory();
    this.searchSubCategory();
    this.searchProducts();
  }

  // 開啟 Modal
  openCategoryModal(type: 'main' | 'sub') {
    this.categoryType = type;
    this.categoryModalTitle = type === 'main' ? '新增主分類' : '新增次分類';
    this.isCategoryModalOpen = true;
  }

  editMainCategoryModal(category: SearchCategoryModel, type: 'main' | 'sub') {
    this.categoryType = type;
    this.categoryModalTitle = type === 'main' ? '編輯主分類' : '編輯次分類';
    this.isEdit = true;
    this.isCategoryModalOpen = true;
    this.newCategoryData.id = category.id;
    this.newCategoryData.parentId = category.parentId;
    this.newCategoryData.name = category.name ?? '';
    this.newCategoryData.status = category.status;
    this.newCategoryData.introduction = category.introduction;
    this.isCategorayEditing = true;
  }

  // 關閉 Modal (也可以處理一些表單重置邏輯)
  closeCategoryModal() {
    this.isCategoryModalOpen = false;
    this.isCategorayEditing = false;
    this.isEdit = false;
    this.newCategoryData = {
      id: null,
      name: '',
      status: true,
      introduction: '',
      parentId: null,
    };
  }

  // 送出表單的商業邏輯
  submitCategoryData() {
    // 檢查 categoray 是否為編輯模式，如果不是編輯模式則呼叫建立categoray api
    if (this.isCategorayEditing) {
      console.log(this.newCategoryData);
      this.http
        .put<ProductCategoryResponseData>(
          `${environment.apiUrl}Product/EditCategory`,
          this.newCategoryData,
        )
        .subscribe((x) => {
          this.closeCategoryModal(); // 儲存完畢後關閉
          this.searchCategory();
          this.searchSubCategory();
        });
    } else {
      this.http
        .postForm<ProductCategoryResponseData>(
          `${environment.apiUrl}Product/CreateCategory`,
          this.newCategoryData,
        )
        .subscribe((x) => {
          if (this.categoryType == 'main') {
            const newItem: SearchCategoryModel = {
              ...x.data,
              index: this.mainCategory.length + 1,
            };
            this.mainCategory.push(newItem);
          } else {
            let mainCat = this.mainCategory.filter(
              (x) => x.id == this.newCategoryData.parentId,
            )[0];
            const newItem: SearchCategoryModel = {
              ...x.data,
              index: this.subCategory.length + 1,
              parentName: mainCat?.name,
            };
            this.subCategory.push(newItem);
          }
          this.closeCategoryModal(); // 儲存完畢後關閉
        });
    }
  }

  searchCategory() {
    this.http
      .get<SearchCategoryModelListResponseData>(
        `${environment.apiUrl}Product/SearchCateGory`,
      )
      .subscribe((x) => {
        this.mainCategory = x.data ?? [];
      });
  }

  searchSubCategory() {
    if (this.parentCategoryId && this.parentCategoryId != 'null') {
      this.nextLayer = false;
    } else {
      this.nextLayer = true;
    }
    this.http
      .get<SearchCategoryModelListResponseData>(
        `${environment.apiUrl}Product/SearchCateGory`,
        {
          categoryId: this.parentCategoryId,
          nextLayer: this.nextLayer,
        },
      )
      .subscribe((x) => {
        this.subCategory = x.data ?? [];
      });
  }

  removeCategory(data: SearchCategoryModel, type: 'main' | 'sub') {
    if (confirm('請問是否要刪除資料?')) {
      let parameterURL =
        type == 'main' ? data.id : `${data.id}/${data.parentId}`;
      this.http
        .delete<ApiResponse>(
          `${environment.apiUrl}Product/RemoveCategory/${parameterURL}`,
        )
        .subscribe((x) => {
          this.searchCategory();
          this.searchSubCategory();
        });
    }
  }

  editCategorySort(type: string, direction: string, item: SearchCategoryModel) {
    this.http
      .put<ApiResponse>(
        `${environment.apiUrl}Product/EditCategorySort/${type}/${direction}`,
        item,
      )
      .subscribe((x) => {
        if (type == 'main') {
          this.searchCategory();
        } else {
          this.searchSubCategory();
        }
      });
  }

  editMainCategory(category: SearchCategoryModel) {
    this.newCategoryData.id = category.id;
    this.newCategoryData.name = category.name ?? '';
    this.newCategoryData.status = category.status;
    this.newCategoryData.introduction = category.introduction;
    this.isCategoryModalOpen = true;
    this.categoryModalTitle = '修改主分類';
    this.isCategorayEditing = true;
    console.log(this.isCategoryModalOpen);
  }

  openProductModal() {}

  closeModals() {}

  filterSubCategories() {}
  openSubCategoryModal() {}
  openMainCategoryModal() {}

  // ================= Product List Methods =================

  searchProducts() {
    let isActiveParams: boolean | undefined = undefined;
    if (this.searchIsActive === 'active') isActiveParams = true;
    if (this.searchIsActive === 'inactive') isActiveParams = false;

    let params: any = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize
    };
    if (this.searchKeyword) params.keyword = this.searchKeyword;
    if (this.searchCategoryId && this.searchCategoryId !== 'all') params.categoryId = this.searchCategoryId;
    if (isActiveParams !== undefined) params.isActive = isActiveParams;

    this.http
      .get<ProductPaginationModelResponseData>(
        `${environment.apiUrl}Product/GetProducts`,
        params
      )
      .subscribe((res) => {
        if (res.data) {
          this.products = res.data.productList || [];
          this.totalCount = res.data.totalCount || 0;
        }
      });
  }

  onFilterChange() {
    this.pageIndex = 0;
    this.searchProducts();
  }

  changePage(page: number) {
    if (page < 0 || page >= Math.ceil(this.totalCount / this.pageSize)) return;
    this.pageIndex = page;
    this.searchProducts();
  }

  getPageArray(): number[] {
    const totalPages = Math.ceil(this.totalCount / this.pageSize);
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  editProduct(id: string | undefined) {
    if (!id) return;
    this.route.navigate([`main/product/edit/${id}`]);
  }

  deleteProduct(id: string | undefined) {
    if (!id) return;
    if (confirm('確定要刪除此產品嗎？')) {
      this.http
        .delete<ApiResponse>(`${environment.apiUrl}Product/DeleteProduct/${id}`)
        .subscribe(() => {
          this.searchProducts();
        });
    }
  }

  toggleProductStatus(id: string | undefined) {
    if (!id) return;
    this.http
      .put<ApiResponse>(`${environment.apiUrl}Product/ToggleProductStatus/${id}`, null)
      .subscribe(() => {
        this.searchProducts();
      });
  }

  editProductSort(id: string | undefined, direction: 'up' | 'down') {
    if (!id) return;
    this.http
      .put<ApiResponse>(`${environment.apiUrl}Product/EditProductSort/${id}/${direction}`, null)
      .subscribe(() => {
        this.searchProducts();
      });
  }
}
