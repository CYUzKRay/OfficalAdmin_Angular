# Share 共享元件庫使用指南 (Skills Memory)

此文件記錄了 `@/src/app/share` 目錄下所有可複用元件、服務與資料模型的詳細規格、輸入/輸出屬性以及範例代碼。未來在開發新功能或修改現有頁面時，請**優先調用此處已實現的元件**，切勿重新開發或複製重複邏輯。

---

## 1. 圖片裁剪元件 `ImageCropperComponent`
用於圖片上傳並進行 Canvas 視覺裁剪，支援自訂裁剪比例、大小限制與預覽。

* **元件選擇器**：`app-image-cropper`
* **表單綁定**：支援 `NG_VALUE_ACCESSOR`，可直接使用 `[(ngModel)]` 雙向綁定裁剪後的 Base64 字串。

### ⚙️ 輸入屬性 (Inputs)
| 屬性名稱 | 類型 | 預設值 | 描述 |
| :--- | :--- | :--- | :--- |
| `[acceptedFormats]` | `string` | `'image/*'` | 接受的檔案格式 (如 `'image/jpeg, image/png'`) |
| `[maxFileSize]` | `number` | `5 * 1024 * 1024` | 檔案大小上限限制 (位元組)，預設 5MB |
| `[recommendedSize]` | `string` | `'1920x800px'` | 介面上顯示的建議尺寸提示文字 |
| `[initialRatio]` | `string` | `'free'` | 初始裁剪比例。可選值如 `'free'`, `'16:9'`, `'4:3'`, `'1:1'` |
| `[showUploadHint]` | `boolean` | `true` | 是否顯示虛線框內部的上傳提示文字 |
| `[showRatioButtons]` | `boolean` | `true` | 是否顯示比例切換按鈕群組 |
| `[autoApplyCrop]` | `boolean` | `false` | 是否在上傳圖片後自動應用預設裁剪區塊 |

### 🔔 輸出事件 (Outputs)
| 事件名稱 | 類型 | 描述 |
| :--- | :--- | :--- |
| `(imageUploaded)` | `EventEmitter<string>` | 上傳成功時觸發，發送原始圖片的 Base64 字串 |
| `(cropApplied)` | `EventEmitter<CropResult>` | 使用者確認裁剪時觸發，發送詳細的裁剪資料物件 |
| `(error)` | `EventEmitter<string>` | 發生錯誤（如格式不符、檔案超大）時發送錯誤訊息 |

#### 📄 `CropResult` 結構定義
```typescript
export interface CropResult {
  original: string;      // 原始 Base64
  cropped: string;       // 裁剪後的 Base64
  cropImage: Blob | null;// 裁剪後的二進位檔案 (可用於 FormData 上傳)
  cropData: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
```

### 💻 使用範例
```html
<app-image-cropper
  [initialRatio]="'16:9'"
  [recommendedSize]="'1200x675px'"
  [(ngModel)]="myCroppedImageBase64"
  (cropApplied)="onCropApplied($event)"
  (error)="onUploadError($event)">
</app-image-cropper>
```

---

## 2. 富文本編輯器 `EditorComponent`
基於 CKEditor 4 的進階內嵌式富文本編輯器，整合了客製化排版元件、FAQ 手風琴折疊、文字/背景調色盤。

* **元件選擇器**：`app-editor`
* **表單綁定**：支援 `NG_VALUE_ACCESSOR`，可直接使用 `[(ngModel)]` 雙向綁定富文本 HTML 字串。編輯器變更時會即時同步變更，無須按額外的按鈕或處理事件。

### 💡 內建進階功能
* **插入頁面元件**：下拉選單提供以下專用排版模組一鍵插入：
  * `image-gallery`：雙欄並排圖片展示
  * `section-header`：標準精美大標題
  * `check-list`：特點勾選清單列表
  * `styled-table`：已美化的資料表格
  * `blockquote`：客戶評價引言區塊
  * `application-grid`：應用場景 2x2 網格
* **全域管理器 (CKEditorManager)**：在 window 物件下掛載了 `initCKEditor`、`getCKEditorData` 等方法，支援程式碼手動控制。

### 💻 使用範例
```html
<app-editor 
  [(ngModel)]="myHTMLContent"
  [ngModelOptions]="{standalone: true}">
</app-editor>
```

---

## 3. 圖庫管理器 `PictureManageComponent`
串接後端 AWS S3 的圖片集中管理系統，支援圖片依資料夾分類列表、即時上傳、刪除、及複製 Base64/圖片網址。

* **元件選擇器**：`app-picture-manage`

### 🔔 輸出事件 (Outputs)
| 事件名稱 | 類型 | 描述 |
| :--- | :--- | :--- |
| `(imageUrlResult)` | `EventEmitter<ImageResult>` | 當使用者點擊「複製網址」或「圖片卡片」時觸發，回傳包含網址與對應 Base64 的資料 |
| `(error)` | `EventEmitter<string>` | 圖片處理出錯時發出警告 |

#### 📄 `ImageResult` 結構定義
```typescript
export class ImageResult {
  constructor(
    public base64: string,
    public url: string
  ) {}
}
```

### 💻 使用範例
常用於 Modal 彈出視窗中作為圖片選擇器：
```html
<app-modal [isOpen]="isGalleryOpen" [title]="'選擇庫存圖片'" (closeModal)="isGalleryOpen = false">
  <app-picture-manage (imageUrlResult)="onImageSelectedFromGallery($event)">
  </app-picture-manage>
</app-modal>
```

---

## 4. 分頁導覽元件 `PaginationComponent`
用於表格或清單的底部分頁切換按鈕，支援動態分頁按鈕渲染、上一頁、下一頁以及分頁群組切換。

* **元件選擇器**：`app-pagination`

### ⚙️ 輸入屬性 (Inputs)
| 屬性名稱 | 類型 | 描述 |
| :--- | :--- | :--- |
| `[TotalCount]` | `number` | 總筆數 (Setter，傳入後會自動重算並生成分頁按鈕) |
| `[PageSize]` | `number` | 每頁顯示筆數，預設值為 `10` |

### 🔔 輸出事件 (Outputs)
| 事件名稱 | 類型 | 描述 |
| :--- | :--- | :--- |
| `(PageIndexUploaded)` | `EventEmitter<number>` | 當分頁切換時觸發，發送當前的 `1-indexed` 頁碼（如點擊第 3 頁，則發送 `3`） |

### 💻 使用範例
```html
<!-- 資料表格 -->
<table>...</table>

<!-- 分頁元件 -->
<app-pagination
  [TotalCount]="totalRows"
  [PageSize]="limit"
  (PageIndexUploaded)="onPageChange($event)">
</app-pagination>
```

---

## 5. 遮罩載入中元件 `LoadingComponent`
全螢幕毛玻璃背景的載入中 (Spinner) 遮罩，適用於 AJAX 請求等異步等待場景。

* **元件選擇器**：`app-loading`
* **使用方式**：直接以 `*ngIf` 控制元件顯示即可。

### 💻 使用範例
```html
<app-loading *ngIf="isLoading"></app-loading>
```

---

## 6. 彈出視窗元件 `ModalComponent`
通用的輕量化彈出式對話框，採用 `<ng-content>` 投影機制，可嵌入任何 HTML 與元件內容。

* **元件選擇器**：`app-modal`

### ⚙️ 輸入屬性 (Inputs)
| 屬性名稱 | 類型 | 預設值 | 描述 |
| :--- | :--- | :--- | :--- |
| `[isOpen]` | `boolean` | `false` | 控制對話框顯示狀態 (`true` 顯示，`false` 隱藏) |
| `[title]` | `string` | `'提示'` | 對話框標題文字 |

### 🔔 輸出事件 (Outputs)
| 事件名稱 | 類型 | 描述 |
| :--- | :--- | :--- |
| `(closeModal)` | `EventEmitter<void>` | 當點擊右上角「✕」按鈕或背景遮罩時觸發，用以通知父元件關閉 |

### 💻 使用範例
```html
<app-modal 
  [isOpen]="isDialogVisible" 
  [title]="'確認刪除產品'" 
  (closeModal)="isDialogVisible = false">
  
  <p>確定要永久刪除此項產品嗎？此操作無法還原。</p>
  
  <div class="sticky-footer">
    <button class="cancel-btn" (click)="isDialogVisible = false">取消</button>
    <button class="save-btn" (click)="confirmDelete()">確定刪除</button>
  </div>
</app-modal>
```

---

## 7. 核心網路請求服務 `HttpService`
專案核心 HTTP 網路請求封裝服務，整合了 Content-Type 處理。在進行任何後端連線時，請**統一注入並調用此服務**。

* **注入方式**：`constructor(private http: HttpService) {}`

### 🛠 提供的 API 方法
```typescript
// 1. GET 請求
get<T>(url: string, params?: any): Observable<T>;

// 2. POST JSON 請求 (自動夾帶 'Content-Type': 'application/json')
postJson<T>(url: string, data: any): Observable<T>;

// 3. PUT JSON 請求 (自動夾帶 'Content-Type': 'application/json')
put<T>(url: string, data: any): Observable<T>;

// 4. POST FormData 請求 (適用於上傳實體檔案/圖片)
postForm<T>(url: string, data: Record<string, any>): Observable<T>;

// 5. DELETE 請求
delete<T>(url: string, params?: any): Observable<T>;
```

### 💻 使用範例
```typescript
// 注入服務
constructor(private http: HttpService) {}

// 調用 GET 獲取清單
loadProducts() {
  this.http.get<ResponseData<Product[]>>(`${environment.apiUrl}Product/List`)
    .subscribe(res => this.products = res.data);
}

// 調用 POST JSON 儲存變更
saveProduct(productData: any) {
  this.http.postJson(`${environment.apiUrl}Product/Save`, productData)
    .subscribe(() => alert('儲存成功'));
}
```
