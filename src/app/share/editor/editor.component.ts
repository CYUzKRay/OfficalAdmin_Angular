import { Component, OnInit, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

declare var CKEDITOR: any;
@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EditorComponent),
      multi: true,
    },
  ],
})
export class EditorComponent implements OnInit, ControlValueAccessor {
  private innerValue: string = '';
  private isEditorReady = false;

  private onChange = (value: string) => {};
  private onTouched = () => {};

  writeValue(value: any): void {
    this.innerValue = value || '';
    if (this.isEditorReady && CKEDITOR.instances.editor) {
      const currentData = CKEDITOR.instances.editor.getData();
      if (currentData !== this.innerValue) {
        CKEDITOR.instances.editor.setData(this.innerValue);
      }
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // 預留唯讀控制
  }
  ngOnInit(): void {
    (window as any).OpenQuestion = this.OpenQuestion.bind(this);

    if (!CKEDITOR.plugins.get('customelements')) {
      // 註冊自定義元件插件
      CKEDITOR.plugins.add('customelements', {
        icons: 'customelements',
        init: (editor: any) => {
          // 添加元件下拉選單
          editor.ui.addRichCombo('CustomElements', {
            label: '插入元件',
            title: '選擇要插入的元件',
            voiceLabel: '插入自定義元件',
            className: 'cke_format',
            multiSelect: false,
            panel: {
              css: [CKEDITOR.skin.getPath('editor')].concat(
                editor.config.contentsCss
              ),
              voiceLabel: editor.lang.panelVoiceLabel,
            },
            init: function () {
              this.startGroup('頁面元件');
              this.add('image-gallery', '圖片展示', '插入雙欄圖片展示');
              this.add('section-header', '標題區塊', '插入帶樣式的標題');
              this.add('check-list', '打勾列表', '插入特點列表');
              this.add('styled-table', '樣式表格', '插入預設樣式表格');
              this.add('blockquote', '引用文字', '插入客戶評價引用');
              this.add('application-grid', '應用場景', '插入應用場景網格');
            },
            onClick: (value: any) => {
              // 佔位圖:插入後請用「圖庫」複製網址,再以編輯器的「插入圖片」替換。
              // 不可寫死任何 S3 網址,舊版曾內嵌預簽名網址,插進去就是死圖。
              var img =
                'data:image/svg+xml;charset=utf-8,' +
                encodeURIComponent(
                  '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320">' +
                    '<rect width="480" height="320" fill="#E2E5E8"/>' +
                    '<text x="240" y="168" font-family="sans-serif" font-size="20" fill="#6B7280" text-anchor="middle">Replace with image</text>' +
                    '</svg>'
                );
              switch (value) {
                case 'image-gallery':
                  editor.insertHtml(`
                    <div class="image-gallery">
                      <div class="image-item">
                        <img src="${img}" alt="環保砂布產品展示">
                      </div>
                      <div class="image-item">
                        <img src="${img}" alt="環保砂布應用場景">
                      </div>
                    </div>
                  `);
                  break;
                case 'section-header':
                  editor.insertHtml(`<h2>請輸入標題內容</h2>`);
                  break;
                case 'check-list':
                  editor.insertHtml(`
                    <div class="check-list-container">
                      <div class="check-list-features">
                        <h3 class="check-list-title">新型環保砂布系列特點</h3>
                        <ul class="check-list">
                          <li>採用可生物降解材料，使用後易於分解，減少環境負擔</li>
                          <li>水性樹脂配方，揮發性有機物(VOC)排放量減少85%</li>
                          <li>製程優化，生產能耗降低30%，碳排放大幅減少</li>
                          <li>無論乾磨或濕磨都保持優異性能，適用範圍廣泛</li>
                          <li>耐用性提升25%，減少更換頻率，降低資源消耗</li>
                          <li>符合國際環保標準，取得多項環保認證</li>
                        </ul>
                      </div>
                    </div>
                  `);
                  break;
                case 'styled-table':
                  editor.insertHtml(`
                    <table>
                      <thead>
                        <tr>
                          <th>產品名稱</th>
                          <th>價格</th>
                          <th>庫存</th>
                          <th>狀態</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>筆記型電腦</td>
                          <td>$1,200</td>
                          <td>25</td>
                          <td>有貨</td>
                        </tr>
                        <tr>
                          <td>智能手機</td>
                          <td>$800</td>
                          <td>42</td>
                          <td>有貨</td>
                        </tr>
                        <tr>
                          <td>平板電腦</td>
                          <td>$500</td>
                          <td>8</td>
                          <td>低庫存</td>
                        </tr>
                      </tbody>
                    </table>
                  `);
                  break;
                case 'blockquote':
                  editor.insertHtml(`
                    <blockquote>
                      "航泰的新型環保砂布不僅環保，性能也非常出色。我們在汽車零件拋光過程中使用後，發現不僅研磨效率提高了，而且產生的粉塵也大幅減少，工作環境明顯改善。" — 台灣某知名汽車零件製造商
                    </blockquote>
                  `);
                  break;
                case 'application-grid':
                  editor.insertHtml(`
                    <div class="application-grid">
                      <div class="application-item">
                        <div class="application-icon">
                          <i class="fas fa-couch"></i>
                        </div>
                        <div class="application-name">家具製造</div>
                      </div>
                      <div class="application-item">
                        <div class="application-icon">
                          <i class="fas fa-tools"></i>
                        </div>
                        <div class="application-name">木工加工</div>
                      </div>
                      <div class="application-item">
                        <div class="application-icon">
                          <i class="fas fa-wrench"></i>
                        </div>
                        <div class="application-name">金屬拋光</div>
                      </div>
                      <div class="application-item">
                        <div class="application-icon">
                          <i class="fas fa-home"></i>
                        </div>
                        <div class="application-name">室內裝修</div>
                      </div>
                    </div>
                  `);
                  break;
              }
              this.updateOutput();
            },
          });
        },
      });
    }

    if (!CKEDITOR.plugins.get('customcolors')) {
      // 註冊自定義顏色選擇器插件
      CKEDITOR.plugins.add('customcolors', {
        icons: 'customcolors',
        init: function (editor: any) {
          // 文字顏色選擇器
          const colorIcon =
            'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCI+PC9jaXJjbGU+PGNpcmNsZSBjeD0iMTIiIGN5PSI4IiByPSIxIj48L2NpcmNsZT48Y2lyY2xlIGN4PSI4IiBjeT0iMTIiIHI9IjEiPjwvY2lyY2xlPjxjaXJjbGUgY3g9IjE2IiBjeT0iMTIiIHI9IjEiPjwvY2lyY2xlPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTYiIHI9IjEiPjwvY2lyY2xlPjwvc3ZnPg==';
          editor.ui.addRichCombo('CustomTextColor', {
            label: '文字顏色',
            // title: '文字顏色',
            voiceLabel: '自定義文字顏色',
            className: 'cke_combo_button_textcolor',
            multiSelect: false,
            icon: colorIcon,
            panel: {
              css: [CKEDITOR.skin.getPath('editor')].concat(
                editor.config.contentsCss
              ),
              voiceLabel: editor.lang.panelVoiceLabel,
            },
            init: function () {
              this.startGroup('預設顏色');
              this.add(
                '#000000',
                '<span style="color:#000000;">■</span> 黑色',
                '黑色'
              );
              this.add(
                '#FF0000',
                '<span style="color:#FF0000;">■</span> 紅色',
                '紅色'
              );
              this.add(
                '#00FF00',
                '<span style="color:#00FF00;">■</span> 綠色',
                '綠色'
              );
              this.add(
                '#0000FF',
                '<span style="color:#0000FF;">■</span> 藍色',
                '藍色'
              );
              this.add(
                '#FFFF00',
                '<span style="color:#FFFF00;">■</span> 黃色',
                '黃色'
              );
              this.add(
                '#FF00FF',
                '<span style="color:#FF00FF;">■</span> 品紅',
                '品紅'
              );
              this.add(
                '#00FFFF',
                '<span style="color:#00FFFF;">■</span> 青色',
                '青色'
              );
              this.add(
                '#808080',
                '<span style="color:#808080;">■</span> 灰色',
                '灰色'
              );

              this.startGroup('操作');
              this.add('custom', '🎨 自定義顏色...', '輸入色碼或使用調色盤');
              this.add('remove', '❌ 移除顏色', '移除文字顏色');
            },
            onClick: function (value: any) {
              if (value === 'custom') {
                // 使用簡單的 prompt 對話框
                var color = prompt(
                  '請輸入色碼 (例如: #FF0000 或 red):',
                  '#FF0000'
                );
                if (color && color.trim()) {
                  // 驗證色碼格式
                  if (
                    color.match(/^#[0-9A-Fa-f]{6}$/) ||
                    color.match(/^#[0-9A-Fa-f]{3}$/) ||
                    color.match(/^[a-zA-Z]+$/)
                  ) {
                    var style = new CKEDITOR.style({
                      element: 'span',
                      styles: { color: color.trim() },
                    });
                    editor.applyStyle(style);
                  } else {
                    alert('請輸入有效的色碼格式，例如: #FF0000、#F00 或 red');
                  }
                }
              } else if (value === 'remove') {
                var style = new CKEDITOR.style({
                  element: 'span',
                  styles: { color: false },
                });
                editor.removeStyle(style);
              } else {
                var style = new CKEDITOR.style({
                  element: 'span',
                  styles: { color: value },
                });
                editor.applyStyle(style);
              }
            },
          });

          // 背景顏色選擇器
          editor.ui.addRichCombo('CustomBgColor', {
            label: '背景顏色',
            title: '背景顏色',
            voiceLabel: '背景顏色',
            className: 'cke_combo_button_bgcolor',
            multiSelect: false,
            panel: {
              css: [CKEDITOR.skin.getPath('editor')].concat(
                editor.config.contentsCss
              ),
              voiceLabel: editor.lang.panelVoiceLabel,
            },
            init: function () {
              this.startGroup('預設顏色');
              this.add(
                '#FFFFFF',
                '<span style="background-color:#FFFFFF;border:1px solid #ccc;">■</span> 白色',
                '白色'
              );
              this.add(
                '#FFFF00',
                '<span style="background-color:#FFFF00;">■</span> 黃色',
                '黃色'
              );
              this.add(
                '#00FF00',
                '<span style="background-color:#00FF00;">■</span> 綠色',
                '綠色'
              );
              this.add(
                '#00FFFF',
                '<span style="background-color:#00FFFF;">■</span> 青色',
                '青色'
              );
              this.add(
                '#FF00FF',
                '<span style="background-color:#FF00FF;">■</span> 品紅',
                '品紅'
              );
              this.add(
                '#0000FF',
                '<span style="background-color:#0000FF;">■</span> 藍色',
                '藍色'
              );
              this.add(
                '#FF0000',
                '<span style="background-color:#FF0000;">■</span> 紅色',
                '紅色'
              );
              this.add(
                '#808080',
                '<span style="background-color:#808080;">■</span> 灰色',
                '灰色'
              );

              this.startGroup('操作');
              this.add('custom', '🎨 自定義顏色...', '輸入色碼或使用調色盤');
              this.add('remove', '❌ 移除背景', '移除背景顏色');
            },
            onClick: function (value: any) {
              if (value === 'custom') {
                // 使用簡單的 prompt 對話框
                var color = prompt(
                  '請輸入背景色碼 (例如: #FFFF00 或 yellow):',
                  '#FFFF00'
                );
                if (color && color.trim()) {
                  // 驗證色碼格式
                  if (
                    color.match(/^#[0-9A-Fa-f]{6}$/) ||
                    color.match(/^#[0-9A-Fa-f]{3}$/) ||
                    color.match(/^[a-zA-Z]+$/)
                  ) {
                    var style = new CKEDITOR.style({
                      element: 'span',
                      styles: { 'background-color': color.trim() },
                    });
                    editor.applyStyle(style);
                  } else {
                    alert(
                      '請輸入有效的色碼格式，例如: #FFFF00、#FF0 或 yellow'
                    );
                  }
                }
              } else if (value === 'remove') {
                var style = new CKEDITOR.style({
                  element: 'span',
                  styles: { 'background-color': false },
                });
                editor.removeStyle(style);
              } else {
                var style = new CKEDITOR.style({
                  element: 'span',
                  styles: { 'background-color': value },
                });
                editor.applyStyle(style);
              }
            },
          });
        },
      });
    }

    // ===================================
    // CKEditor 管理器 - 主要的可複用模組
    // ===================================
    (window as any).CKEditorManager = {
      // 默認配置
      defaultConfig: {
        contentsCss: [
          'https://cdn.ckeditor.com/4.17.2/standard-all/contents.css',
          '/assets/css/editor.css',
        ],
        allowedContent: true,
        extraPlugins:
          'faq,tableresize,tabletools,tableselection,customelements,customcolors,justify',
        height: 350, // 修正：設置合適的預設高度
        width: '100%', // 新增：確保寬度填滿容器
        resize_enabled: true, // 新增：允許使用者調整大小
        resize_minHeight: 200, // 新增：最小高度
        resize_maxHeight: 600, // 新增：最大高度
        toolbar: [
          {
            name: 'document',
            items: ['Source', '-', 'Save', 'NewPage', 'Preview'],
          },
          {
            name: 'clipboard',
            items: [
              'Cut',
              'Copy',
              'Paste',
              'PasteText',
              'PasteFromWord',
              '-',
              'Undo',
              'Redo',
            ],
          },
          {
            name: 'basicstyles',
            items: [
              'Bold',
              'Italic',
              'Underline',
              'Strike',
              'Subscript',
              'Superscript',
              '-',
              'RemoveFormat',
            ],
          },
          {
            name: 'paragraph',
            items: [
              'NumberedList',
              'BulletedList',
              '-',
              'Outdent',
              'Indent',
              '-',
              'Blockquote',
            ],
          },
          {
            name: 'align',
            items: [
              'JustifyLeft',
              'JustifyCenter',
              'JustifyRight',
              'JustifyBlock',
            ],
          },
          { name: 'links', items: ['Link', 'Unlink', 'Anchor'] },
          {
            name: 'insert',
            items: ['Image', 'Table', 'HorizontalRule', 'SpecialChar'],
          },
          { name: 'colors', items: ['CustomTextColor', 'CustomBgColor'] },
          { name: 'styles', items: ['Format', 'Font', 'FontSize'] },
          { name: 'custom', items: ['CustomElements', 'FAQ'] },
          { name: 'tools', items: ['Maximize', 'ShowBlocks'] },
        ],
      },

      // 存储所有编辑器实例
      editors: {},
      isInitialized: false, // 防止重複初始化

      // 初始化單個編輯器
      initSingleEditor: function (
        elementId: any,
        config = {},
        initialContent = ''
      ) {
        const finalConfig = Object.assign({}, this.defaultConfig, config);

        return new Promise((resolve, reject) => {
          // 檢查元素是否存在
          const element = document.getElementById(elementId);
          if (!element) {
            console.warn(`Element with id "${elementId}" not found`);
            reject(new Error(`Element with id "${elementId}" not found`));
            return;
          }

          // 如果已經初始化過，先銷毀
          if (this.editors[elementId]) {
            this.editors[elementId].destroy();
            delete this.editors[elementId];
          }

          const editor = CKEDITOR.replace(elementId, finalConfig);

          editor.on('instanceReady', () => {
            this.editors[elementId] = editor;

            // 設置初始內容
            if (initialContent) {
              editor.setData(initialContent);
            }

            // 監聽變更事件
            editor.on('change', () => {
              this.updateOutput(elementId);
            });

            // 初始更新輸出
            this.updateOutput(elementId);

            console.log(`CKEditor initialized: ${elementId}`);
            resolve(editor);
          });

          editor.on('error', (err: any) => {
            console.error(`Error initializing CKEditor for ${elementId}:`, err);
            reject(err);
          });
        });
      },

      // 批量初始化編輯器（使用 class 選擇器）
      initMultipleEditors: function (
        selector = '.ckeditor-instance',
        config = {}
      ) {
        const textareas = document.querySelectorAll(selector);
        console.log(`Found ${textareas.length} editors to initialize`);

        const promises: any[] = [];

        textareas.forEach((textarea, index) => {
          // 自動生成唯一 ID
          if (!textarea.id) {
            textarea.id = 'ckeditor-' + index;
          }

          const editorId = textarea.id;
          const initialContent = textarea.getAttribute('data-initial') || '';

          console.log(`Initializing editor: ${editorId}`);

          const promise = this.initSingleEditor(
            editorId,
            config,
            initialContent
          );
          promises.push(promise);
        });

        return Promise.all(promises)
          .then((editors) => {
            console.log('All editors initialized successfully');
            return editors;
          })
          .catch((error) => {
            console.error('Error initializing some editors:', error);
            throw error;
          });
      },

      // 更新輸出預覽
      updateOutput: function (editorId: any) {
        const textarea = document.getElementById(editorId);
        if (!textarea || !this.editors[editorId]) return;

        const outputId = textarea.getAttribute('data-output');
        if (outputId) {
          const content = this.editors[editorId].getData();
          const outputElement = document.getElementById(outputId);
          if (outputElement) {
            outputElement.innerHTML = content;
          }
        }
      },

      // 更新編輯器輸出（給插件使用）
      updateEditorOutput: function (editor: any) {
        const editorId = editor.name;
        this.updateOutput(editorId);
      },

      // 獲取所有編輯器內容
      getAllData: function () {
        const data: any = {};
        for (const editorId in this.editors) {
          data[editorId] = this.editors[editorId].getData();
        }
        return data;
      },

      // 設置所有編輯器內容
      setAllData: function (data: any) {
        for (const editorId in data) {
          if (this.editors[editorId]) {
            this.editors[editorId].setData(data[editorId]);
          }
        }
      },

      // 獲取單個編輯器內容
      getData: function (editorId: any) {
        return this.editors[editorId] ? this.editors[editorId].getData() : '';
      },

      // 設置單個編輯器內容
      setData: function (editorId: any, data: any) {
        if (this.editors[editorId]) {
          this.editors[editorId].setData(data);
        }
      },

      // 調整編輯器大小
      resizeEditors: function (container: any) {
        const editorsInContainer = container
          ? container.querySelectorAll('.ckeditor-instance')
          : document.querySelectorAll('.ckeditor-instance');

        editorsInContainer.forEach((textarea: any) => {
          const instance = this.editors[textarea.id];
          if (instance) {
            instance.resize();
          }
        });
      },

      // 銷毀所有編輯器
      destroyAll: function () {
        for (const editorId in this.editors) {
          if (this.editors[editorId]) {
            this.editors[editorId].destroy();
            delete this.editors[editorId];
          }
        }
        this.isInitialized = false;
      },

      // 銷毀單個編輯器
      destroy: function (editorId: any) {
        if (this.editors[editorId]) {
          this.editors[editorId].destroy();
          delete this.editors[editorId];
        }
      },
    };

    // ===================================
    // 修正：移除自動初始化邏輯，改為手動調用
    // ===================================

    // 導出給全域使用的便捷函數
    (window as any).initCKEditor = (
      window as any
    ).CKEditorManager.initSingleEditor.bind((window as any).CKEditorManager);
    (window as any).initMultipleCKEditors = (
      window as any
    ).CKEditorManager.initMultipleEditors.bind((window as any).CKEditorManager);
    (window as any).getCKEditorData = (
      window as any
    ).CKEditorManager.getData.bind((window as any).CKEditorManager);
    (window as any).setCKEditorData = (
      window as any
    ).CKEditorManager.setData.bind((window as any).CKEditorManager);
    (window as any).getAllCKEditorData = (
      window as any
    ).CKEditorManager.getAllData.bind((window as any).CKEditorManager);
    (window as any).setAllCKEditorData = (
      window as any
    ).CKEditorManager.setAllData.bind((window as any).CKEditorManager);

    // 向後兼容：自動初始化邏輯（但避免衝突）
    document.addEventListener('DOMContentLoaded', function () {
      // 只在沒有手動初始化的情況下自動初始化
      setTimeout(() => {
        if (!(window as any).CKEditorManager.isInitialized) {
          // 檢查是否存在單個編輯器（向後兼容）
          const singleEditor = document.getElementById('editor');
          if (
            singleEditor &&
            !(window as any).CKEditorManager.editors['editor']
          ) {
            console.log('Auto-initializing single editor');
            (window as any).CKEditorManager.initSingleEditor('editor', {}, '');
          }

          // 檢查是否存在多個編輯器（但沒有被手動初始化）
          const multipleEditors =
            document.querySelectorAll('.ckeditor-instance');
          if (
            multipleEditors.length > 0 &&
            Object.keys((window as any).CKEditorManager.editors).length === 0
          ) {
            console.log('Auto-initializing multiple editors');
            (window as any).CKEditorManager.initMultipleEditors();
          }
        }
      }, 100); // 延遲確保其他腳本有機會手動初始化
    });

    // 初始化 CKEditor
    CKEDITOR.replace('editor', {
      versionCheck: false, // 禁用版本檢查
      contentsCss: [
        'https://cdn.ckeditor.com/4.17.2/standard-all/contents.css',
        '/assets/css/editor.css',
      ],
      allowedContent: true,
      extraPlugins:
        'faq,tableresize,tabletools,tableselection,customelements,customcolors,justify',
      height: 400,
      toolbar: [
        {
          name: 'document',
          items: ['Source', '-', 'Save', 'NewPage', 'Preview'],
        },
        {
          name: 'clipboard',
          items: [
            'Cut',
            'Copy',
            'Paste',
            'PasteText',
            'PasteFromWord',
            '-',
            'Undo',
            'Redo',
          ],
        },
        {
          name: 'basicstyles',
          items: [
            'Bold',
            'Italic',
            'Underline',
            'Strike',
            'Subscript',
            'Superscript',
            '-',
            'RemoveFormat',
          ],
        },
        {
          name: 'paragraph',
          items: [
            'NumberedList',
            'BulletedList',
            '-',
            'Outdent',
            'Indent',
            '-',
            'Blockquote',
          ],
        },
        {
          name: 'align',
          items: [
            'JustifyLeft',
            'JustifyCenter',
            'JustifyRight',
            'JustifyBlock',
          ],
        },
        { name: 'links', items: ['Link', 'Unlink', 'Anchor'] },
        {
          name: 'insert',
          items: ['Image', 'Table', 'HorizontalRule', 'SpecialChar'],
        },
        '/',
        { name: 'styles', items: ['Format', 'Font', 'FontSize'] },
        { name: 'colors', items: ['CustomTextColor', 'CustomBgColor'] },
        '/',
        { name: 'custom', items: ['CustomElements', 'FAQ'] },
        { name: 'tools', items: ['Maximize', 'ShowBlocks'] },
      ],
    });

    // 等待編輯器準備就緒
    CKEDITOR.instances.editor.on('instanceReady', (e: any) => {
      this.isEditorReady = true;
      e.editor.setData(this.innerValue || '');
      this.updateOutput();
    });

    // 監聽編輯器內容變化
    CKEDITOR.instances.editor.on('change', () => {
      const data = CKEDITOR.instances.editor.getData();
      this.innerValue = data;
      this.onChange(data);
      this.updateOutput();
    });
  }

  updateOutput() {
    var content = CKEDITOR.instances.editor.getData();
    const outputElement = document.getElementById('output');
    if (outputElement) {
      outputElement.innerHTML = content;
    }
  }

  OpenQuestion(event: any) {
    let targetElement = event.target.getAttribute('tag')
      ? event.target.parentElement.parentElement
      : event.target.parentElement;
    let checkTargetElementIsActive = targetElement.classList.contains('active');
    // 取消所有問題集
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach((item) => {
      item.classList.remove('active');
      const otherToggle = item.querySelector('.faq-toggle');
      otherToggle!.textContent = '+';
    });

    if (!checkTargetElementIsActive) {
      // 展開當前選中的問題
      const toggle = targetElement.querySelector('.faq-toggle');
      targetElement.classList.toggle('active');

      if (targetElement.classList.contains('active')) {
        toggle.textContent = '−';
      } else {
        toggle.textContent = '+';
      }
    }
  }
}
