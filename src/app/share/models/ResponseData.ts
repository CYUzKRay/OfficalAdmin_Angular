import { Response } from './Response';

/**
 * 帶資料的泛型回應包裝。
 * @deprecated 請改用具體的 ResponseData 型別，例如：
 * `import { NewsModelResponseData } from 'src/app/core/api/models'`
 */
export interface ResponseData<T> extends Response {
  data: T;
}
