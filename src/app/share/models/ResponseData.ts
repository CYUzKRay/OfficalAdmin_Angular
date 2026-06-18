import { Response } from './Response';

export interface ResponseData<T> extends Response {
  data: T;
}
