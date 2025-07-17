import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface CropResult {
  original: string;
  cropped: string;
  cropData: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

@Component({
  selector: 'app-image-cropper',
  templateUrl: './image-cropper.component.html',
  styleUrls: ['./image-cropper.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ImageCropperComponent),
      multi: true,
    },
  ],
})
export class ImageCropperComponent
  implements OnInit, OnDestroy, ControlValueAccessor
{
  @ViewChild('fileInput') fileInputRef!: ElementRef;
  @ViewChild('cropImage') cropImageRef!: ElementRef;
  @ViewChild('cropOverlay') cropOverlayRef!: ElementRef;
  @ViewChild('cropContainer') cropContainerRef!: ElementRef;

  // 輸入屬性
  @Input() acceptedFormats: string = 'image/*';
  @Input() maxFileSize: number = 5 * 1024 * 1024; // 5MB
  @Input() recommendedSize: string = '1920x800px';
  @Input() initialRatio: string = 'free';
  @Input() showUploadHint: boolean = true;
  @Input() showRatioButtons: boolean = true;
  @Input() autoApplyCrop: boolean = false;

  // 輸出事件
  @Output() imageUploaded = new EventEmitter<string>();
  @Output() cropApplied = new EventEmitter<CropResult>();
  @Output() error = new EventEmitter<string>();

  // 組件狀態
  selectedImageUrl: string | null = null;
  uploadedImage: string | null = null;
  croppedImage: string | null = null;
  isImageLoaded: boolean = false;

  // 裁剪相關變數
  isDragging = false;
  isResizing = false;
  dragStart = { x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 };
  resizeHandle: string | null = null;
  currentRatio = 'free';

  // 事件監聽器引用
  private mouseMoveListener?: (e: MouseEvent) => void;
  private mouseUpListener?: (e: MouseEvent) => void;

  // ControlValueAccessor 實現
  private onChange = (value: string | null) => {};
  private onTouched = () => {};

  constructor() {}

  ngOnInit() {
    this.currentRatio = this.initialRatio;
    this.setupGlobalEventListeners();
  }

  ngOnDestroy() {
    this.removeGlobalEventListeners();
  }

  // ControlValueAccessor 方法
  writeValue(value: string | null): void {
    if (value) {
      this.selectedImageUrl = value;
      this.uploadedImage = value;
      setTimeout(() => {
        this.initCrop();
      }, 100);
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // 可以根據需要實現禁用狀態
  }

  private setupGlobalEventListeners() {
    this.mouseMoveListener = (e: MouseEvent) => this.handleMouseMove(e);
    this.mouseUpListener = (e: MouseEvent) => this.handleMouseUp(e);

    document.addEventListener('mousemove', this.mouseMoveListener);
    document.addEventListener('mouseup', this.mouseUpListener);
  }

  private removeGlobalEventListeners() {
    if (this.mouseMoveListener) {
      document.removeEventListener('mousemove', this.mouseMoveListener);
    }
    if (this.mouseUpListener) {
      document.removeEventListener('mouseup', this.mouseUpListener);
    }
  }

  // 公共方法
  openFileDialog() {
    this.fileInputRef.nativeElement.click();
  }

  clearImage() {
    this.selectedImageUrl = null;
    this.uploadedImage = null;
    this.croppedImage = null;
    this.isImageLoaded = false;
    this.onChange(null);
    this.fileInputRef.nativeElement.value = '';
  }

  getCroppedImage(): string | null {
    return this.croppedImage;
  }

  getOriginalImage(): string | null {
    return this.uploadedImage;
  }

  // 文件選擇處理
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // 驗證文件類型
    if (!file.type.startsWith('image/')) {
      this.error.emit('請選擇圖片檔案！');
      return;
    }

    // 驗證文件大小
    if (file.size > this.maxFileSize) {
      this.error.emit(`檔案大小不能超過 ${this.maxFileSize / 1024 / 1024}MB！`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.uploadedImage = e.target.result;
      this.selectedImageUrl = e.target.result;
      this.isImageLoaded = false;

      if (this.uploadedImage) {
        this.imageUploaded.emit(this.uploadedImage);
      }

      setTimeout(() => {
        this.initCrop();
      }, 100);
    };

    reader.onerror = () => {
      this.error.emit('讀取檔案時發生錯誤！');
    };

    reader.readAsDataURL(file);
  }

  // 拖拽上傳處理
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      // 模擬文件選擇事件
      const mockEvent = {
        target: {
          files: files,
        },
      };
      this.onFileSelected(mockEvent);
    }
  }

  // 初始化裁剪功能
  initCrop() {
    if (!this.cropImageRef || !this.cropOverlayRef) {
      console.error('裁剪元素未找到');
      return;
    }

    const cropImage = this.cropImageRef.nativeElement;
    const overlay = this.cropOverlayRef.nativeElement;

    cropImage.onload = () => {
      this.isImageLoaded = true;
      const rect = cropImage.getBoundingClientRect();

      // 設定初始裁剪區域
      const initialWidth = Math.min(rect.width * 0.8, 400);
      const initialHeight = Math.min(rect.height * 0.6, 240);
      const initialX = (rect.width - initialWidth) / 2;
      const initialY = (rect.height - initialHeight) / 2;

      overlay.style.left = initialX + 'px';
      overlay.style.top = initialY + 'px';
      overlay.style.width = initialWidth + 'px';
      overlay.style.height = initialHeight + 'px';

      // 應用初始比例
      if (this.currentRatio !== 'free') {
        this.applyRatio(this.currentRatio);
      }

      // 如果設置了自動應用裁剪
      if (this.autoApplyCrop) {
        setTimeout(() => this.applyCrop(), 500);
      }
    };
  }

  // 裁剪事件處理
  startDrag(event: MouseEvent) {
    event.preventDefault();
    this.isDragging = true;
    this.onTouched();

    const overlay = this.cropOverlayRef.nativeElement;
    const rect = overlay.getBoundingClientRect();

    this.dragStart.x = event.clientX - rect.left;
    this.dragStart.y = event.clientY - rect.top;
  }

  startResize(event: MouseEvent, handleClass: string) {
    event.preventDefault();
    event.stopPropagation();

    this.isResizing = true;
    this.resizeHandle = handleClass;
    this.onTouched();

    const overlay = this.cropOverlayRef.nativeElement;
    const rect = overlay.getBoundingClientRect();

    this.dragStart.x = event.clientX;
    this.dragStart.y = event.clientY;
    this.dragStart.width = rect.width;
    this.dragStart.height = rect.height;
    this.dragStart.left = rect.left;
    this.dragStart.top = rect.top;
  }

  private handleMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      this.handleDrag(event);
    } else if (this.isResizing) {
      this.handleResize(event);
    }
  }

  private handleDrag(event: MouseEvent) {
    const overlay = this.cropOverlayRef.nativeElement;
    const cropImage = this.cropImageRef.nativeElement;
    const containerRect = overlay.parentElement.getBoundingClientRect();
    const imageRect = cropImage.getBoundingClientRect();

    let x = event.clientX - containerRect.left - this.dragStart.x;
    let y = event.clientY - containerRect.top - this.dragStart.y;

    x = Math.max(0, Math.min(x, imageRect.width - overlay.offsetWidth));
    y = Math.max(0, Math.min(y, imageRect.height - overlay.offsetHeight));

    overlay.style.left = x + 'px';
    overlay.style.top = y + 'px';
  }

  private handleResize(event: MouseEvent) {
    const overlay = this.cropOverlayRef.nativeElement;
    const cropImage = this.cropImageRef.nativeElement;
    const containerRect = overlay.parentElement.getBoundingClientRect();
    const imageRect = cropImage.getBoundingClientRect();

    const deltaX = event.clientX - this.dragStart.x;
    const deltaY = event.clientY - this.dragStart.y;

    let newWidth = this.dragStart.width;
    let newHeight = this.dragStart.height;
    let newLeft = overlay.offsetLeft;
    let newTop = overlay.offsetTop;

    const handleClass = this.resizeHandle!;

    if (handleClass.includes('right')) {
      newWidth = Math.max(50, this.dragStart.width + deltaX);
    }
    if (handleClass.includes('left')) {
      newWidth = Math.max(50, this.dragStart.width - deltaX);
      newLeft = Math.min(
        this.dragStart.left - containerRect.left + deltaX,
        overlay.offsetLeft
      );
    }
    if (handleClass.includes('bottom')) {
      newHeight = Math.max(30, this.dragStart.height + deltaY);
    }
    if (handleClass.includes('top')) {
      newHeight = Math.max(30, this.dragStart.height - deltaY);
      newTop = Math.min(
        this.dragStart.top - containerRect.top + deltaY,
        overlay.offsetTop
      );
    }

    newLeft = Math.max(0, Math.min(newLeft, imageRect.width - newWidth));
    newTop = Math.max(0, Math.min(newTop, imageRect.height - newHeight));
    newWidth = Math.min(newWidth, imageRect.width - newLeft);
    newHeight = Math.min(newHeight, imageRect.height - newTop);

    overlay.style.left = newLeft + 'px';
    overlay.style.top = newTop + 'px';
    overlay.style.width = newWidth + 'px';
    overlay.style.height = newHeight + 'px';
  }

  private handleMouseUp(event: MouseEvent) {
    this.isDragging = false;
    this.isResizing = false;
    this.resizeHandle = null;
  }

  // 比例設定
  setRatio(ratio: string) {
    this.currentRatio = ratio;
    this.applyRatio(ratio);
  }

  private applyRatio(ratio: string) {
    if (ratio === 'free' || !this.cropOverlayRef) {
      return;
    }

    const overlay = this.cropOverlayRef.nativeElement;
    const [w, h] = ratio.split(':').map(Number);
    const aspectRatio = w / h;

    const currentWidth = overlay.offsetWidth;
    const newHeight = currentWidth / aspectRatio;

    overlay.style.height = newHeight + 'px';
  }

  isRatioActive(ratio: string): boolean {
    return this.currentRatio === ratio;
  }

  // 應用裁剪
  applyCrop(): Promise<CropResult | null> {
    return new Promise((resolve, reject) => {
      if (!this.cropOverlayRef || !this.cropImageRef || !this.uploadedImage) {
        const error = '請先上傳圖片！';
        this.error.emit(error);
        reject(error);
        return;
      }

      const overlay = this.cropOverlayRef.nativeElement;
      const cropImageElement = this.cropImageRef.nativeElement;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        const error = '瀏覽器不支援 Canvas！';
        this.error.emit(error);
        reject(error);
        return;
      }

      // 計算裁剪區域
      const scaleX =
        cropImageElement.naturalWidth / cropImageElement.offsetWidth;
      const scaleY =
        cropImageElement.naturalHeight / cropImageElement.offsetHeight;

      const cropX = overlay.offsetLeft * scaleX;
      const cropY = overlay.offsetTop * scaleY;
      const cropWidth = overlay.offsetWidth * scaleX;
      const cropHeight = overlay.offsetHeight * scaleY;

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      const img = new Image();
      img.onload = () => {
        try {
          ctx.drawImage(
            img,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            cropWidth,
            cropHeight
          );

          this.croppedImage = canvas.toDataURL();

          const result: CropResult = {
            original: this.uploadedImage!,
            cropped: this.croppedImage,
            cropData: {
              x: cropX,
              y: cropY,
              width: cropWidth,
              height: cropHeight,
            },
          };

          this.onChange(this.croppedImage);
          this.cropApplied.emit(result);
          resolve(result);
        } catch (error) {
          this.error.emit('裁剪過程中發生錯誤！');
          reject(error);
        }
      };

      img.onerror = () => {
        const error = '載入圖片時發生錯誤！';
        this.error.emit(error);
        reject(error);
      };

      img.src = this.uploadedImage;
    });
  }
}
