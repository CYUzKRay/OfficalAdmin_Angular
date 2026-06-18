import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css'],
})
export class ModalComponent {
  // 控制 Modal 顯示/隱藏
  @Input() isOpen: boolean = false;

  // Modal 標題
  @Input() title: string = '提示';

  // 當使用者點擊右上角 X 或遮罩時，發送關閉事件給父元件
  @Output() closeModal = new EventEmitter<void>();

  // 觸發關閉
  close() {
    this.closeModal.emit();
  }
}
