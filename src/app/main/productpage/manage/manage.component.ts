import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CategoryModel } from './category';
import { HttpService } from 'src/app/share/service/http.service';
import { ResponseData } from 'src/app/share/models/ResponseData';
import { environment } from 'src/environments/environment';

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

  newCategoryData = {
    id: null,
    name: '',
    status: true,
    introduction: '',
    parentId: null,
  };

  parentCategoryId: string | null = null;
  nextLayer: boolean = true;

  mainCategory: CategoryModel[] = [];
  subCategory: CategoryModel[] = [];

  isEdit = false;

  constructor(
    private route: Router,
    private http: HttpService,
  ) {}

  ngOnInit(): void {
    this.searchCategory();
    this.searchSubCategory();
  }

  // 開啟 Modal
  openCategoryModal(type: 'main' | 'sub') {
    this.categoryType = type;
    this.categoryModalTitle = type === 'main' ? '新增主分類' : '新增次分類';
    this.isCategoryModalOpen = true;
  }

  editMainCategoryModal(category: any, type: 'main' | 'sub') {
    this.categoryType = type;
    this.categoryModalTitle = type === 'main' ? '編輯主分類' : '編輯次分類';
    this.isEdit = true;
    this.isCategoryModalOpen = true;
    this.newCategoryData.id = category.id;
    this.newCategoryData.parentId = category.parentId;
    this.newCategoryData.name = category.name;
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
        .put(
          'http://localhost:5133/api/Product/EditCategory',
          this.newCategoryData,
        )
        .subscribe((x) => {
          this.closeCategoryModal(); // 儲存完畢後關閉
          this.searchCategory();
          this.searchSubCategory();
        });
    } else {
      this.http
        .postForm<
          ResponseData<CategoryModel>
        >('http://localhost:5133/api/Product/CreateCategory', this.newCategoryData)
        .subscribe((x) => {
          if (this.categoryType == 'main') {
            x.data.index = this.mainCategory.length + 1;
            this.mainCategory.push(x.data);
          } else {
            let mainCategory = this.mainCategory.filter(
              (x) => x.id == this.newCategoryData.parentId,
            )[0];
            x.data.index = this.subCategory.length + 1;
            x.data.parentName = mainCategory.name;
            this.subCategory.push(x.data);
          }
          this.closeCategoryModal(); // 儲存完畢後關閉
        });
    }
  }

  searchCategory() {
    this.http
      .get<
        ResponseData<CategoryModel[]>
      >(`${environment.apiUrl}Product/SearchCateGory`)
      .subscribe((x) => {
        this.mainCategory = x.data;
      });
  }

  searchSubCategory() {
    if (this.parentCategoryId && this.parentCategoryId != 'null') {
      this.nextLayer = false;
    } else {
      this.nextLayer = true;
    }
    this.http
      .get<ResponseData<CategoryModel[]>>(
        `${environment.apiUrl}Product/SearchCateGory`,
        {
          categoryId: this.parentCategoryId,
          nextLayer: this.nextLayer,
        },
      )
      .subscribe((x) => {
        this.subCategory = x.data;
      });
  }

  removeCategory(data: CategoryModel, type: 'main' | 'sub') {
    if (confirm('請問是否要刪除資料?')) {
      let parameterURL =
        type == 'main' ? data.id : `${data.id}/${data.parentId}`;
      this.http
        .delete(`${environment.apiUrl}Product/RemoveCategory/${parameterURL}`)
        .subscribe((x) => {
          this.searchCategory();
          this.searchSubCategory();
        });
    }
  }

  editCategorySort(type: string, direction: string, item: CategoryModel) {
    this.http
      .put(
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

  editMainCategory(category: any) {
    this.newCategoryData.id = category.id;
    this.newCategoryData.name = category.name;
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
}
