CKEDITOR.plugins.add("faq", {
  requires: "widget,dialog",
  init: function (editor) {
    // === 對話框註冊（保留你原本的內容，僅把 onShow / onOk 串到 widget） ===
    CKEDITOR.dialog.add("faqDialog", function (editor) {
      return {
        title: "常見問題編輯器",
        minWidth: 800,
        minHeight: 600,

        contents: [
          {
            id: "tab-basic",
            label: "常見問題設定",
            elements: [
              {
                type: "text",
                id: "faqTitle",
                label: "標題",
                default: "常見問題",
                validate: CKEDITOR.dialog.validate.notEmpty("標題不能為空"),
              },
              {
                type: "html",
                html: '<div style="margin: 10px 0;"><strong>問題與解答</strong></div>',
              },
              {
                type: "html",
                id: "faqEditor",
                html:
                  '<div id="faq-editor-container" style="display: flex; gap: 20px; height: 400px;">' +
                  '<div style="flex: 1;">' +
                  '<div style="margin-bottom: 10px;">' +
                  '<button type="button" id="add-faq-btn" style="padding: 8px 16px; background: #0084ff; color: white; border: none; border-radius: 4px; cursor: pointer;">新增問題</button>' +
                  '<button type="button" id="remove-faq-btn" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">刪除選中項目</button>' +
                  "</div>" +
                  '<div style="border: 1px solid #ccc; height: 350px; overflow-y: auto;" id="faq-list">' +
                  "<!-- FAQ 列表將在這裡顯示 -->" +
                  "</div>" +
                  "</div>" +
                  '<div style="flex: 1; display: flex; flex-direction: column;">' +
                  '<div style="margin-bottom: 10px;">' +
                  "<label><strong>編輯選中的問題</strong></label>" +
                  "</div>" +
                  '<div style="margin-bottom: 15px;">' +
                  "<label>問題:</label><br>" +
                  '<input type="text" id="current-question" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" placeholder="請輸入問題">' +
                  "</div>" +
                  '<div style="flex: 1;">' +
                  "<label>解答:</label><br>" +
                  '<textarea id="current-answer" style="width: 100%; height: 280px; padding: 8px; border: 1px solid #ccc; border-radius: 4px; resize: vertical;" placeholder="請輸入解答（支援HTML格式）"></textarea>' +
                  "</div>" +
                  "</div>" +
                  "</div>",
              },
            ],
          },
        ],

        onShow: function () {
          var dialog = this;

          // ===== 共用工具函數 =====
          dialog.initializeNewFaq = function () {
            dialog.setValueOf("tab-basic", "faqTitle", "常見問題");
            dialog.faqData = [
              {
                question: "範例問題",
                answer: "<p>這是範例解答，您可以修改此內容。</p>",
              },
            ];
            dialog.currentIndex = 0;
            dialog.renderFaqList();
            dialog.selectFaqItem(0);
          };

          dialog.loadExistingFaq = function (faqSection) {
            var titleElement = faqSection.findOne("h2");
            var title = titleElement ? titleElement.getText() : "常見問題";
            dialog.setValueOf("tab-basic", "faqTitle", title);

            var faqItems = faqSection.find(".faq-item");
            var faqData = [];
            for (var i = 0; i < faqItems.count(); i++) {
              var item = faqItems.getItem(i);
              var questionElement = item.findOne(".faq-question span");
              var answerElement = item.findOne(".faq-answer");
              if (questionElement && answerElement) {
                faqData.push({
                  question: questionElement.getText(),
                  answer: answerElement.getHtml(),
                });
              }
            }

            dialog.faqData = faqData.length
              ? faqData
              : [
                  {
                    question: "範例問題",
                    answer: "<p>這是範例解答，您可以修改此內容。</p>",
                  },
                ];
            dialog.currentIndex = 0;
            dialog.renderFaqList();
            dialog.selectFaqItem(0);
          };

          dialog.bindEvents = function () {
            setTimeout(function () {
              var doc = CKEDITOR.document;
              if (dialog.eventsInitialized) return;
              dialog.eventsInitialized = true;

              var addBtn = doc.getById("add-faq-btn");
              if (addBtn && !addBtn.hasEventBound) {
                addBtn.hasEventBound = true;
                addBtn.on("click", function () {
                  dialog.faqData.push({
                    question: "新問題",
                    answer: "<p>請輸入解答</p>",
                  });
                  dialog.renderFaqList();
                  dialog.selectFaqItem(dialog.faqData.length - 1);
                });
              }

              var removeBtn = doc.getById("remove-faq-btn");
              if (removeBtn && !removeBtn.hasEventBound) {
                removeBtn.hasEventBound = true;
                removeBtn.on("click", function () {
                  if (dialog.faqData.length > 1 && dialog.currentIndex >= 0) {
                    dialog.faqData.splice(dialog.currentIndex, 1);
                    dialog.currentIndex = Math.min(
                      dialog.currentIndex,
                      dialog.faqData.length - 1
                    );
                    dialog.renderFaqList();
                    dialog.selectFaqItem(dialog.currentIndex);
                  } else {
                    alert("至少需要保留一個問題項目");
                  }
                });
              }

              var questionInput = doc.getById("current-question");
              if (questionInput && !questionInput.hasEventBound) {
                questionInput.hasEventBound = true;
                questionInput.on("input", function () {
                  if (
                    dialog.currentIndex >= 0 &&
                    dialog.faqData &&
                    dialog.currentIndex < dialog.faqData.length
                  ) {
                    dialog.faqData[dialog.currentIndex].question =
                      this.getValue();
                    dialog.updateCurrentItemDisplay();
                  }
                });
              }

              var answerInput = doc.getById("current-answer");
              if (answerInput && !answerInput.hasEventBound) {
                answerInput.hasEventBound = true;
                answerInput.on("input", function () {
                  if (
                    dialog.currentIndex >= 0 &&
                    dialog.faqData &&
                    dialog.currentIndex < dialog.faqData.length
                  ) {
                    dialog.faqData[dialog.currentIndex].answer =
                      this.getValue();
                  }
                });
              }
            }, 100);
          };

          dialog.updateCurrentItemDisplay = function () {
            var listContainer = CKEDITOR.document.getById("faq-list");
            if (
              !listContainer ||
              dialog.currentIndex < 0 ||
              !dialog.faqData ||
              dialog.currentIndex >= dialog.faqData.length
            )
              return;
            var items = listContainer.find(".faq-list-item");
            if (dialog.currentIndex < items.count()) {
              var currentItem = items.getItem(dialog.currentIndex);
              var newText =
                "<strong>Q" +
                (dialog.currentIndex + 1) +
                ":</strong> " +
                CKEDITOR.tools.htmlEncode(
                  dialog.faqData[dialog.currentIndex].question
                );
              currentItem.setHtml(newText);
            }
          };

          dialog.renderFaqList = function () {
            var listContainer = CKEDITOR.document.getById("faq-list");
            if (!listContainer || !dialog.faqData) return;
            var html = "";
            for (var i = 0; i < dialog.faqData.length; i++) {
              var isSelected = i === dialog.currentIndex ? " selected" : "";
              html +=
                '<div class="faq-list-item' +
                isSelected +
                '" data-index="' +
                i +
                '" style="padding: 10px; border-bottom: 1px solid #eee; cursor: pointer; ' +
                (isSelected ? "background: #e3f2fd;" : "") +
                '">';
              html +=
                "<strong>Q" +
                (i + 1) +
                ":</strong> " +
                CKEDITOR.tools.htmlEncode(dialog.faqData[i].question);
              html += "</div>";
            }
            listContainer.setHtml(html);

            if (!listContainer.hasClickHandler) {
              listContainer.hasClickHandler = true;
              listContainer.on("click", function (evt) {
                var target = evt.data.getTarget();
                var listItem = target.getAscendant(function (el) {
                  return el.hasClass && el.hasClass("faq-list-item");
                }, true);
                if (listItem) {
                  var index = parseInt(listItem.getAttribute("data-index"));
                  if (!isNaN(index)) dialog.selectFaqItem(index);
                }
              });
            }
          };

          dialog.selectFaqItem = function (index) {
            if (index < 0 || !dialog.faqData || index >= dialog.faqData.length)
              return;
            dialog.currentIndex = index;
            var item = dialog.faqData[index];
            var questionInput = CKEDITOR.document.getById("current-question");
            var answerInput = CKEDITOR.document.getById("current-answer");
            if (questionInput && item)
              questionInput.setValue(item.question || "");
            if (answerInput && item) answerInput.setValue(item.answer || "");
            dialog.updateSelectionDisplay();
          };

          dialog.updateSelectionDisplay = function () {
            var listContainer = CKEDITOR.document.getById("faq-list");
            if (!listContainer) return;
            var items = listContainer.find(".faq-list-item");
            for (var i = 0; i < items.count(); i++) {
              var item = items.getItem(i);
              var index = parseInt(item.getAttribute("data-index"));
              if (index === dialog.currentIndex) {
                item.addClass("selected");
                item.setStyle("background", "#e3f2fd");
              } else {
                item.removeClass("selected");
                item.setStyle("background", "");
              }
            }
          };

          dialog.generateFaqHtml = function (title, faqData) {
            var html = '<div class="container">';
            html += '<div class="section-header">';
            html += "<h2>" + CKEDITOR.tools.htmlEncode(title) + "</h2>";
            html += "</div>";
            html += '<div class="faq-container">';
            for (var i = 0; i < faqData.length; i++) {
              var item = faqData[i];
              var faqId = "faq-item-" + i;
              html +=
                '<div class="faq-item" id="' +
                faqId +
                '">' +
                '<div class="faq-question" onclick="OpenQuestion(event)">' +
                "<span>" +
                CKEDITOR.tools.htmlEncode(item.question) +
                "</span>" +
                '<div class="faq-toggle" tag="symbol">+</div>' +
                "</div>" +
                '<div class="faq-answer">' +
                item.answer +
                "</div>" +
                "</div>";
            }
            html += "</div>";
            html += "</div>";
            html += "<p>&nbsp;</p>";
            return html;
          };

          // ===== 這裡關鍵：判斷是「編輯既有 widget」或「插入新 FAQ」 =====
          var widget =
            dialog.widget || (editor.widgets && editor.widgets.focused);
          if (widget && widget.name === "faq") {
            // 從 widget DOM 載入現有資料
            dialog.loadExistingFaq(widget.element);
          } else {
            // 新增模式
            dialog.initializeNewFaq();
          }

          dialog.bindEvents();
        },

        onOk: function () {
          var dialog = this;
          var title = dialog.getValueOf("tab-basic", "faqTitle");

          if (dialog.currentIndex >= 0) {
            var questionInput = CKEDITOR.document.getById("current-question");
            var answerInput = CKEDITOR.document.getById("current-answer");
            if (questionInput && answerInput) {
              dialog.faqData[dialog.currentIndex].question =
                questionInput.getValue();
              dialog.faqData[dialog.currentIndex].answer =
                answerInput.getValue();
            }
          }

          var html = dialog.generateFaqHtml(title, dialog.faqData);

          // 如果是從 widget 開起（編輯模式），直接寫回該 widget 的 DOM
          var widget =
            dialog.widget || (editor.widgets && editor.widgets.focused);
          if (widget && widget.name === "faq") {
            widget.element.setHtml(html);
            return;
          }

          // 否則插入新的 FAQ 區塊，並初始化為 widget
          var wrappedHtml =
            '<section class="faq-section" data-faq="1">' + html + "</section>";
          var el = CKEDITOR.dom.element.createFromHtml(wrappedHtml);
          editor.insertElement(el);
          editor.widgets.initOn(el, "faq");
        },
      };
    });

    // === 工具列按鈕 ===
    editor.ui.addButton("FAQ", {
      label: "插入問題",
      command: "insertFaq",
      toolbar: "insert",
      className: "cke_button_faq_text",
    });

    // === 插入 FAQ 指令（插入空白 FAQ 並直接開 dialog） ===
    editor.addCommand("insertFaq", {
      exec: function (editor) {
        editor.openDialog("faqDialog");
      },
    });

    // ===（選用）提供右鍵選單「編輯常見問題」===
    if (editor.contextMenu) {
      editor.addMenuGroup("faqGroup");
      editor.addMenuItem("faqItem", {
        label: "編輯常見問題",
        command: "editFaq",
        group: "faqGroup",
      });

      editor.contextMenu.addListener(function (element) {
        var root = element && element.getAscendant("section", true);
        if (root && root.hasClass("faq-section")) {
          return { faqItem: CKEDITOR.TRISTATE_OFF };
        }
      });
    }

    editor.addCommand("editFaq", {
      exec: function (editor) {
        var w = editor.widgets && editor.widgets.focused;
        if (w && w.name === "faq") {
          editor.openDialog("faqDialog");
        }
      },
    });

    // === Widget 定義：只有在 widget 上雙擊才會開 dialog ===
    editor.widgets.add("faq", {
      upcast: function (el) {
        return el.name == "section" && el.hasClass("faq-section");
      },
      // 放寬 ACF（可自行改成更嚴謹的規則）
      allowedContent: true,
      requiredContent: "section(faq-section)",
      dialog: "faqDialog",

      init: function () {
        // 需要時可把 DOM 解析到 this.data
        // （目前直接由 dialog 從 DOM 讀寫即可）
      },

      data: function () {
        // 若改成用 this.setData(...)，可在這裡把 data 寫回 DOM
      },
    });

    // === 移除舊的全域雙擊攔截 ===
    // （不用 editor.on('doubleclick')，雙擊行為由 widget 自動處理）
  },
});
