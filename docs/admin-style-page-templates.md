# 後台系統頁面排版與樣式指南 (Page Templates & Styles Memory)

此文件詳細記錄了 `@/src/styles.css` 的全域色彩、字型及元件設計系統，並針對專案中最常見的兩大頁面類型（**列表管理頁面 Manage** 與 **新增/編輯頁面 Add**）提供標準的 HTML 結構骨架與 RWD 規範。未來在新增功能或頁面時，請**務必遵循此指南**，直接調用全域樣式與類別，確保整體後台視覺與操作體驗的高度一致性。

---

## 🎨 1. 核心設計系統 (Design System Tokens)

### 🔴 系統主色調 (Colors)
後台系統使用精緻和諧的海洋藍綠色系，在 `styles.css` 中定義為以下變數：
```css
:root {
  --primary-color: #499fb6;      /* 湖水藍 (主色調，用於主按鈕、邊框) */
  --secondary-color: #d5ecf4;    /* 冰透藍 (背景淡色，用於表頭、標籤背景) */
  --accent-color: #2a7b8f;       /* 深藍綠 (重音色，用於次級動作、懸停文字) */
  --dark-accent: #1d545f;        /* 墨綠藍 (深重音色，用於標題、高對比文字) */
  --text-color: #333333;         /* 深灰色 (內文字體顏色) */
  --light-bg: #f8fbfc;           /* 灰藍白 (系統全域背景色) */
  --border-color: #e0e0e0;       /* 淺灰色 (框線、分割線) */
}
```

### 🏷️ 狀態與分類標籤 (Badges)
系統內建統一的圓角標籤（`.category-badge` 與 `.status-badge`），用於列表展示：

#### 🟢 狀態標籤 (Status Badge)
* **啟用/已發布**：`.status-badge.active` (綠色調)
* **停用/草稿**：`.status-badge.inactive` (灰色調)
```html
<span class="status-badge active">上架中</span>
<span class="status-badge inactive">下架</span>
```

#### 🔵 分類標籤 (Category Badge)
依照業務劃分不同背景色，不需額外撰寫 inline-style：
* 消息分類：`.company` (公司), `.product` (產品), `.event` (活動), `.media` (媒體)
* 產品分類：`.sandpaper` (砂紙), `.sandpaper-roll` (砂布捲), `.sandpaper-belt` (砂布環帶), `.sandpaper-sheet` (砂布片)
```html
<span class="category-badge product">產品資訊</span>
<span class="category-badge sandpaper-belt">砂布環帶</span>
```

---

## 📋 2. 「列表管理頁面」標準模板 (Manage Page Template)

管理頁面主要用於資料篩選、清單展示與分頁導覽。

### 🏗️ 核心 HTML 結構骨架
```html
<div class="admin-container">
  <!-- ① 頁頭標題區 -->
  <div class="admin-header">
    <h1>產品管理</h1>
    <div class="page-title">管理後台所有產品項目，支援排序與分類篩選</div>
  </div>

  <!-- ② 主要內容與篩選區 -->
  <div class="content-section">
    <div class="section-header">
      <h2>產品列表</h2>
      <!-- 導向新增頁面的標準按鈕 -->
      <button class="add-btn" type="button" routerLink="../add">
        <i class="fas fa-plus"></i> 新增產品
      </button>
    </div>

    <!-- ③ 篩選與搜尋工具列 -->
    <div class="filter-tools">
      <!-- 分類選擇器 -->
      <div class="filter-group">
        <label for="categoryFilter">產品分類</label>
        <select id="categoryFilter">
          <option value="">全部商品</option>
          <option value="sandpaper-belt">砂布環帶</option>
          <option value="sandpaper">砂紙</option>
        </select>
      </div>

      <!-- 關鍵字搜尋框 (採用 .search-box 組合) -->
      <div class="filter-group">
        <label for="searchKeyword">搜尋產品</label>
        <div class="search-box">
          <input type="text" id="searchKeyword" placeholder="輸入關鍵字進行搜尋..." />
          <button class="search-btn" type="button">搜尋</button>
        </div>
      </div>
    </div>

    <!-- ④ 資料展示表格區 -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>預覽圖</th>
            <th>產品名稱</th>
            <th>型號規格</th>
            <th>上架狀態</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <img src="assets/images/default.jpg" class="preview-img" alt="產品縮圖" />
            </td>
            <td><strong>砂布環帶 36"</strong></td>
            <td>X799 / 4" x 36"</td>
            <td><span class="status-badge active">上架中</span></td>
            <td>
              <div class="action-buttons">
                <button class="view-btn" type="button">查看</button>
                <button class="edit-btn" type="button">編輯</button>
                <button class="delete-btn" type="button">刪除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ⑤ 共享分頁元件 -->
    <app-pagination
      [TotalCount]="totalItems"
      [PageSize]="pageSize"
      (PageIndexUploaded)="onPageChange($event)">
    </app-pagination>
  </div>
</div>
```

---

## 📝 3. 「新增與編輯頁面」標準模板 (Add & Edit Page Template)

新增/編輯頁面由表單控制項、自訂元件（如圖片裁切、富文本編輯器）以及底部浮動式操作列組成。

### 🏗️ 核心 HTML 結構骨架
```html
<div class="admin-container">
  <!-- ① 頁頭標題區 -->
  <div class="admin-header">
    <h1>新增產品</h1>
    <div class="page-title">填寫產品詳細資訊、設定規格番號並上傳產品照片</div>
  </div>

  <form class="edit-form" (submit)="$event.preventDefault()">
    <!-- ② 表單分區卡片 -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">基本資訊</h2>
      </div>
      <div class="card-body">
        <!-- 網格列佈局 (.form-row) -->
        <div class="form-row">
          <!-- 產品名稱 (50% 寬度) -->
          <div class="form-group col-6">
            <label class="form-label" for="prodName">
              產品名稱 <span class="required">*</span>
            </label>
            <input
              type="text"
              id="prodName"
              class="form-control"
              placeholder="請輸入產品名稱"
              required
            />
          </div>

          <!-- 型號 (50% 寬度) -->
          <div class="form-group col-6">
            <label class="form-label" for="prodModel">型號</label>
            <input
              type="text"
              id="prodModel"
              class="form-control"
              placeholder="e.g. X799"
            />
          </div>
        </div>

        <div class="form-row">
          <!-- 分類選擇 (50% 寬度) -->
          <div class="form-group col-6">
            <label class="form-label" for="prodCategory">主要分類</label>
            <select id="prodCategory" class="form-control">
              <option value="sandpaper-belt">砂布環帶</option>
              <option value="sandpaper">砂紙</option>
            </select>
          </div>

          <!-- 狀態切換開關 (50% 寬度) -->
          <div class="form-group col-6">
            <label class="form-label">上架狀態</label>
            <div class="toggle-row">
              <label class="toggle-switch">
                <input type="checkbox" checked />
                <span class="toggle-slider"></span>
              </label>
              <span class="toggle-label">上架中</span>
            </div>
          </div>
        </div>

        <!-- 富文本編輯器區塊 (100% 寬度) -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">產品詳細描述</label>
            <app-editor
              [(ngModel)]="productDescription"
              [ngModelOptions]="{standalone: true}">
            </app-editor>
            <p class="form-hint">使用富文本編輯器編寫消息內容，支援圖片與表格插入</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ③ 底部固定操作列 -->
    <div class="card" style="margin-top: 20px; padding-bottom: 0; overflow: hidden;">
      <div class="card-body" style="padding-bottom: 0;">
        <div class="sticky-footer">
          <button class="cancel-btn" type="button" onclick="history.back()">取消</button>
          <button class="save-btn" type="button" (click)="onSave()">儲存變更</button>
        </div>
      </div>
    </div>
  </form>
</div>
```

---

## 📱 4. 響應式佈局規範 (RWD Rules)

為確保行動裝置（手機、平板）上的流暢閱讀與良好點擊體驗，系統採用了 `@media (max-width: 768px)` 媒體查詢進行自適應縮放，規範如下：

### 📱 1. 欄位自動坍塌 (Grid Reflow)
* 所有設定為 `.col-4`、`.col-5`、`.col-6`、`.col-7` 等多欄佈局的 `.form-group`，在寬度低於 `768px` 時，會自動強制變更為 `width: 100%`（垂直單欄排列）。
* 篩選工具列 `.filter-tools` 的排列方向會改為 `flex-direction: column`。

### 📱 2. 按鈕全寬拉直 (Full-width Buttons)
* 底部操作區域 `.form-actions` 與 `.sticky-footer` 中的按鈕會轉為垂直重疊，並且每一個按鈕皆會呈現 **`width: 100%`** 的全寬狀態，方便手指單手觸碰點擊。
* 列表中操作按鈕列 `.action-buttons` 也會從水平並排轉為垂直並排。

### 📱 3. 表格自適應滑動 (Table Scrolling)
* 全部的表格都必須包裹在 `.table-container` 中，藉此在小螢幕時自動啟用 `overflow-x: auto;` 水平滾動，確保資料不被截斷。

---

## 🛠️ 5. 互動式表單與進階防呆設計

* **必填指示**：標籤文字旁如需指示必填，請一律使用 `<span class="required">*</span>` 以呈現高對比紅色星號。
* **按鈕防重複提交**：非同步表單送出（如 `SaveDraft()` 或 `onSave()`）時，一律先設定狀態 `this.isFinish = true`（顯示全螢幕 `app-loading` 元件），阻止使用者再次點擊存檔。
* **取消確認防呆**：凡是點擊「取消」按鈕，必須在 TS 端以 `confirm('是否確定取消')` 提示使用者，防止未存檔資料意外丟失。
