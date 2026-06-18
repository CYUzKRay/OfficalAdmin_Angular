export interface CategoryModel {
  index: number;
  id: string;
  name: string;
  status: boolean;
  orders: number;
  introduction: string;
  parentId: string;
  parentName: string;
  CanDelete: boolean;
}
