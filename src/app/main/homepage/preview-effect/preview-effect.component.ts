import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';

type Device = 'desktop' | 'tablet' | 'mobile';

/**
 * 首頁輪播的預覽。
 *
 * 用官網真正的 css(API 的 /site-preview/ 提供產生器的 Assets)渲染首頁主視覺,放在 iframe 裡 ——
 * 響應式斷點照官網的 media query 走,不是後台另外抄一份版型。
 * 官網樣式改了這裡自動跟上;只有 hero 的 HTML 結構是照 index.html 複製的,那邊結構變了要回來同步。
 */
@Component({
  selector: 'app-preview-effect',
  templateUrl: './preview-effect.component.html',
  styleUrls: ['./preview-effect.component.css'],
})
export class PreviewEffectComponent implements OnChanges, AfterViewInit, OnDestroy {
  /** 標題:官網只拿來當圖片的 alt,不會顯示在畫面上 */
  @Input() previewTitle: string = '';
  @Input() previewUrl: string = '';
  @Input() previewImage: string = '';

  @Output() closePreview = new EventEmitter<void>();

  @ViewChild('stage') stage!: ElementRef<HTMLElement>;
  @ViewChild('frame') frame!: ElementRef<HTMLIFrameElement>;

  /** 各裝置的視窗寬度,分別落在官網斷點(1024 / 860)的兩側 */
  readonly devices: { key: Device; label: string; icon: string; width: number }[] = [
    { key: 'desktop', label: '桌面版', icon: 'fa-desktop', width: 1280 },
    { key: 'tablet', label: '平板', icon: 'fa-tablet-alt', width: 820 },
    { key: 'mobile', label: '手機', icon: 'fa-mobile-alt', width: 390 },
  ];
  currentDevice: Device = 'desktop';

  srcdoc: SafeHtml = '';
  frameHeight = 600;
  scale = 1;

  private resizeObserver?: ResizeObserver;

  constructor(private sanitizer: DomSanitizer) {}

  get frameWidth(): number {
    return this.devices.find((d) => d.key === this.currentDevice)!.width;
  }

  ngOnChanges(): void {
    this.srcdoc = this.sanitizer.bypassSecurityTrustHtml(this.buildHtml());
  }

  ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver(() => this.updateScale());
    this.resizeObserver.observe(this.stage.nativeElement);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  setDevice(device: Device) {
    this.currentDevice = device;
    this.updateScale();
  }

  /** 依內容調整 iframe 高度;不同寬度下主視覺高度差很多 */
  onFrameLoad() {
    const doc = this.frame?.nativeElement.contentDocument;
    if (doc?.documentElement) {
      this.frameHeight = doc.documentElement.scrollHeight;
    }
  }

  Close() {
    this.closePreview.emit();
  }

  /** 桌面版 1280px 塞不進後台的內容區,整個等比縮小,不改變版面本身 */
  private updateScale() {
    const available = this.stage?.nativeElement.clientWidth ?? this.frameWidth;
    this.scale = Math.min(1, available / this.frameWidth);
    // 換寬度後 iframe 內容會重排,等它排完再量高度
    setTimeout(() => this.onFrameLoad(), 50);
  }

  private buildHtml(): string {
    const base = `${environment.apiUrl.replace(/api\/?$/, '')}site-preview`;
    const alt = escapeHtml(this.previewTitle || '輪播圖');
    const img = this.previewImage
      ? `<img src="${escapeHtml(this.previewImage)}" alt="${alt}" />`
      : `<div class="pv-empty">尚未選擇圖片</div>`;
    const slide = this.previewUrl ? `<a href="${escapeHtml(this.previewUrl)}">${img}</a>` : img;

    // 結構照 Hatai.SiteGen/Templates/index.html 的 hero 區塊;data-reveal 直接加 is-in,不跑進場動畫
    return `<!doctype html>
<html lang="zh-Hant-TW">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="stylesheet" href="${base}/css/base.css" />
<link rel="stylesheet" href="${base}/css/home.css" />
<style>
  a { pointer-events: none; }
  .pv-empty { display: grid; place-items: center; width: 100%; height: 100%;
    background: #e2e5e8; color: #6b7280; font-size: 15px; }
</style>
</head>
<body>
<main>
  <section class="hero" aria-label="形象主視覺">
    <div class="container hero-in">
      <div class="hero-copy">
        <span class="hero-eyebrow is-in" data-reveal>Taiwan Coated Abrasives</span>
        <h1 class="hero-title is-in" data-reveal>專業研磨材料供應<br />砂帶客製加工服務</h1>
        <div class="grit-rule hero-rule is-in" data-reveal role="presentation"></div>
        <p class="hero-lead is-in" data-reveal>
          深耕研磨材料三十餘年，整合國際品牌砂布、砂紙與自廠加工能力，依工件材質、設備規格及表面要求，提供合適的研磨材料與客製砂帶，滿足金屬加工、航太製造及各式工業研磨需求。
        </p>
        <div class="hero-actions is-in" data-reveal>
          <a class="btn btn-primary" href="#">瀏覽產品目錄</a>
          <a class="btn btn-ghost" href="#">聯絡報價</a>
        </div>
      </div>
      <div class="hero-stage">
        <figure class="carousel" aria-roledescription="輪播" aria-label="形象輪播圖">
          <div class="carousel-track">
            <div class="carousel-slide is-active">${slide}</div>
          </div>
          <figcaption class="carousel-bar">
            <span class="carousel-caption">航泰砂布・專業研磨耗材</span>
            <div class="carousel-ctrl">
              <span class="carousel-index"><b>01</b><i>/</i>01</span>
            </div>
          </figcaption>
        </figure>
      </div>
    </div>
  </section>
</main>
</body>
</html>`;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
