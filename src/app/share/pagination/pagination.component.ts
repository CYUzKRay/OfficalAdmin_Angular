import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css'],
})
export class PaginationComponent {
  private totalCount = 0;
  @Input()
  set TotalCount(value: number) {
    if (value) {
      this.totalCount = value;
      this.RenderPagination();
    }
  }
  pageSize: number = 10;
  @Input()
  set PageSize(value: number) {
    if (value) {
      this.pageSize = value;
    }
  }

  pageCount: number = 0;
  currentPageIndex: number = 1;
  @Output() PageIndexUploaded = new EventEmitter<number>();

  paginationSize: number = 10;
  paginations: number[] = [];

  constructor() {}

  RenderPagination() {
    this.pageCount = Math.ceil(this.totalCount / this.pageSize);
    for (let i = 1; i <= this.pageCount; i++) {
      if (this.paginations.length >= this.paginationSize) {
        return;
      }
      this.paginations.push(i);
    }
  }

  choosePage(index: number) {
    if (this.currentPageIndex != index) {
      this.currentPageIndex = index;
      this.PageIndexUploaded.emit(this.currentPageIndex);
    }
  }

  previousPage() {
    if (this.currentPageIndex == 1) {
      return;
    }
    this.currentPageIndex -= 1;
    this.PageIndexUploaded.emit(this.currentPageIndex);
    if (this.currentPageIndex % this.paginationSize == 0) {
      this.reSetPage(false);
    }
  }

  nextPage() {
    if (this.currentPageIndex == this.pageCount) return;

    this.currentPageIndex += 1;
    this.PageIndexUploaded.emit(this.currentPageIndex);
    if ((this.currentPageIndex - 1) % this.paginationSize == 0) {
      this.reSetPage(true);
    }
  }

  //reSetPage(next/previous,pageNumber)
  reSetPage(direction: boolean) {
    //start = pageNumber-paginationSize;
    //end = pageNumber
    this.paginations = [];
    var start = 0;
    var end = 0;

    if (direction) {
      start = this.currentPageIndex;
      end =
        this.currentPageIndex + this.paginationSize > this.pageCount
          ? this.pageCount
          : this.currentPageIndex + this.paginationSize - 1;
    } else {
      start = this.currentPageIndex + 1 - this.paginationSize;
      end = this.currentPageIndex;
    }
    console.log(start);
    console.log(end);

    for (let i = start; i <= end; i++) {
      this.paginations.push(i);
    }
  }
}
