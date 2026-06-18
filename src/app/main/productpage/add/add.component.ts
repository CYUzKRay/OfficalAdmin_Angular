import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { HttpService } from 'src/app/share/service/http.service';
import { environment } from 'src/environments/environment';
import {
  SearchCategoryModel,
  SearchCategoryModelListResponseData,
  Response as ApiResponse,
} from 'src/app/core/api/models';
import { GritItem } from './gritItem';
import { ImageItem } from './imageItem';

declare var CKEDITOR: any;

@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.css'],
})
export class AddComponent implements OnInit, OnDestroy {
  // ── ID 產生器（兩個列表共用，確保唯一）──
  private nextId = 1;

  // ════════════════════════════════════════
  //  番號管理
  // ════════════════════════════════════════
  items: GritItem[] = [];

  // ── 產品描述（富文本編輯器） ──
  productDescription = '';

  // ── 材質 ──
  material = '';

  // ── 是否可購買 ──
  can_order = false;

  // ── 產品基本屬性 ──
  productName = '';
  isActive = true;
  unit = '';
  modelNumber = '';
  specification = '';
  usage = '';
  selectedMainCategoryId = '';
  selectedSubCategoryId = '';

  mainCategories: SearchCategoryModel[] = [];
  subCategories: SearchCategoryModel[] = [];

  ngOnInit(): void {
    const defaults = [
      '40#',
      '60#',
      '80#',
      '100#',
      '120#',
      '150#',
      '180#',
      '240#',
    ];
    this.items = defaults.map((g) => ({
      id: this.nextId++,
      grit: g,
      price: null,
    }));
    this.loadMainCategories();
  }

  loadMainCategories(): void {
    this.http
      .get<SearchCategoryModelListResponseData>(`${environment.apiUrl}Product/SearchCateGory`)
      .subscribe((res) => {
        this.mainCategories = res.data ?? [];
      });
  }

  onMainCategoryChange(): void {
    this.selectedSubCategoryId = '';
    this.subCategories = [];
    if (!this.selectedMainCategoryId) {
      return;
    }
    this.http
      .get<SearchCategoryModelListResponseData>(
        `${environment.apiUrl}Product/SearchCateGory`,
        {
          categoryId: this.selectedMainCategoryId,
          nextLayer: false,
        }
      )
      .subscribe((res) => {
        this.subCategories = res.data ?? [];
      });
  }

  addItem(): void {
    this.items = [...this.items, { id: this.nextId++, grit: '', price: null }];
    setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>(
        '.grit-row .grit-input',
      );
      inputs[inputs.length - 1]?.focus();
    }, 50);
  }

  // ── 批次輸入與常用範本相關屬性與方法 ──
  showBulkInput = false;
  bulkInputText = '';

  applyPreset(presetType: string): void {
    let grits: string[] = [];
    switch (presetType) {
      case 'coarse':
        grits = ['40#', '60#', '80#', '100#', '120#'];
        break;
      case 'medium-fine':
        grits = ['150#', '180#', '240#', '320#', '400#'];
        break;
      case 'ultra-fine':
        grits = ['600#', '800#', '1000#', '1200#', '1500#'];
        break;
      case 'standard':
        grits = ['40#', '80#', '120#', '180#', '240#', '320#', '400#', '600#', '800#'];
        break;
    }

    if (this.items.length === 1 && !this.items[0].grit.trim()) {
      this.items = [];
    }

    const newItems = grits.map((g) => ({
      id: this.nextId++,
      grit: g,
      price: null,
    }));

    this.items = [...this.items, ...newItems];
    this.cdr.markForCheck();
  }

  generateBulkGrits(): void {
    if (!this.bulkInputText.trim()) {
      this.showBulkInput = false;
      return;
    }

    const rawGrits = this.bulkInputText.split(/[,，、\s\n]+/);
    const grits = rawGrits
      .map((g) => g.trim())
      .filter((g) => g.length > 0);

    if (grits.length > 0) {
      if (this.items.length === 1 && !this.items[0].grit.trim()) {
        this.items = [];
      }

      const newItems = grits.map((g) => ({
        id: this.nextId++,
        grit: /^\d+$/.test(g) ? g + '#' : g,
        price: null,
      }));

      this.items = [...this.items, ...newItems];
    }

    this.bulkInputText = '';
    this.showBulkInput = false;
    this.cdr.markForCheck();
  }

  removeItem(index: number): void {
    if (this.items.length <= 1) return;
    this.items = this.items.filter((_, i) => i !== index);
  }

  dropGrit(event: CdkDragDrop<GritItem[]>): void {
    moveItemInArray(this.items, event.previousIndex, event.currentIndex);
    this.items = [...this.items];
  }

  trackGritById(_: number, item: GritItem): number {
    return item.id;
  }

  get hasCustomPrice(): boolean {
    return this.items.some((i) => i.price !== null);
  }

  hasEmptyRow(): boolean {
    return this.items.some((i) => !i.grit.trim());
  }

  minPrice(): number {
    const prices = this.items
      .map((i) => i.price)
      .filter((p): p is number => p !== null);
    return prices.length ? Math.min(...prices) : 0;
  }

  maxPrice(): number {
    const prices = this.items
      .map((i) => i.price)
      .filter((p): p is number => p !== null);
    return prices.length ? Math.max(...prices) : 0;
  }

  // ════════════════════════════════════════
  //  圖片上傳管理
  // ════════════════════════════════════════
  readonly MAX_SIZE_MB = 5;
  readonly ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  images: ImageItem[] = [];
  errorMessage = '';
  isDragOver = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private http: HttpService,
    private router: Router
  ) {}

  triggerInput(input: HTMLInputElement): void {
    input.click();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    this.addFiles(Array.from(input.files));
    input.value = '';
  }

  onDropFiles(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    if (!event.dataTransfer) return;
    this.addFiles(Array.from(event.dataTransfer.files));
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(): void {
    this.isDragOver = false;
  }

  private addFiles(files: File[]): void {
    this.errorMessage = '';
    const errors: string[] = [];

    for (const file of files) {
      if (!this.ACCEPTED_TYPES.includes(file.type)) {
        errors.push(`「${file.name}」格式不支援，僅接受 JPG / PNG / WebP`);
        continue;
      }
      if (file.size > this.MAX_SIZE_MB * 1024 * 1024) {
        errors.push(`「${file.name}」超過 ${this.MAX_SIZE_MB}MB 限制`);
        continue;
      }
      this.images = [
        ...this.images,
        {
          id: this.nextId++,
          file,
          previewUrl: URL.createObjectURL(file),
          isMain: this.images.length === 0,
        },
      ];
    }

    if (errors.length) this.errorMessage = errors.join('；');
    this.cdr.markForCheck();
  }

  removeImage(index: number): void {
    URL.revokeObjectURL(this.images[index].previewUrl);
    this.images.splice(index, 1);
    this.images = [...this.images];
    if (this.images.length > 0 && !this.images.some((i) => i.isMain)) {
      this.images[0].isMain = true;
    }
    this.cdr.markForCheck();
  }

  setMain(index: number): void {
    this.images = this.images.map((img, i) => ({
      ...img,
      isMain: i === index,
    }));
  }

  dropImage(event: CdkDragDrop<ImageItem[]>): void {
    moveItemInArray(this.images, event.previousIndex, event.currentIndex);
    this.images = this.images.map((img, i) => ({ ...img, isMain: i === 0 }));
    this.cdr.markForCheck();
  }

  trackImageById(_: number, item: ImageItem): number {
    return item.id;
  }

  getFiles(): File[] {
    return this.images.map((i) => i.file);
  }

  // ════════════════════════════════════════
  //  表單送出
  // ════════════════════════════════════════
  onSave(): void {
    if (!this.productName.trim()) {
      alert('請輸入產品名稱');
      return;
    }

    if (!this.selectedSubCategoryId) {
      alert('請選擇次分類');
      return;
    }

    if (this.items.length === 0) {
      alert('請至少設定一筆番號');
      return;
    }

    if (this.hasEmptyRow()) {
      alert('番號欄位不可為空');
      return;
    }

    const formData = new FormData();

    // 產品基本屬性
    formData.append('Name', this.productName.trim());
    formData.append('IsActive', String(this.isActive));
    formData.append('Unit', this.unit);
    formData.append('ModelNumber', this.modelNumber);
    formData.append('Material', this.material);
    formData.append('Usage', this.usage);
    formData.append('Specification', this.specification);
    formData.append('Description', this.productDescription);
    formData.append('CanOrder', String(this.can_order));
    formData.append('SubCategoryId', this.selectedSubCategoryId);

    // 番號資料
    this.items.forEach((item, i) => {
      formData.append(`Grits[${i}].Grit`, item.grit);
      formData.append(`Grits[${i}].Price`, item.price !== null ? String(item.price) : '0');
    });

    // 圖片（主圖排第一，由 getFiles() 取得對應順序）
    this.getFiles().forEach((file) => {
      formData.append('Pictures', file);
    });

    this.http
      .postForm<ApiResponse>(`${environment.apiUrl}Product/CreateProduct`, formData)
      .subscribe({
        next: (res) => {
          alert('產品新增成功！');
          this.router.navigate(['main/product/manage']);
        },
        error: (err) => {
          console.error(err);
          alert('產品新增失敗，請稍後再試。');
        }
      });
  }

  ngOnDestroy(): void {
    this.images.forEach((i) => URL.revokeObjectURL(i.previewUrl));
  }
}
