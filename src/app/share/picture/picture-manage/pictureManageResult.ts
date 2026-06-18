export type { S3PictureModel as pictureManageResult } from 'src/app/core/api/models';
export type { S3PictureModel as pictureManageResultContent } from 'src/app/core/api/models';

export class ImageResult {
  base64URL: string = '';
  imageURL: string = '';
  constructor(base64: string, url: string) {
    this.base64URL = base64;
    this.imageURL = url;
  }
}
