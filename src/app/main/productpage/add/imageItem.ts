export interface ImageItem {
  id: number;
  file?: File;
  previewUrl: string;
  isMain: boolean;
  originalId?: string;
  /** 替代文字(alt);空字串代表沒填,官網會用「產品名稱 產品圖 N」 */
  alt: string;
}
