export interface pictureManageResult {
  directory: string;
  images: pictureManageResultContent[];
}

export interface pictureManageResultContent {
  url: string;
  smallImageUrl: string;
  directories: string;
  imageName: string;
  smallImageName: string;
}

export class ImageResult {
  base64URL: string = '';
  imageURL: string = '';
  constructor(base64: string, url: string) {
    this.base64URL = base64;
    this.imageURL = url;
  }
}
