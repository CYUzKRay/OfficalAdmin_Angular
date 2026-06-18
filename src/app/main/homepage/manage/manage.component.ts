import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from 'src/app/share/service/http.service';
import { environment } from 'src/environments/environment';
import {
  SearchHomeCarouselModel,
  SearchHomeCarouselModelListResponseData,
  HomeCarouselResponseData,
  Response as ApiResponse,
} from 'src/app/core/api/models';

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.css'],
})
export class ManageComponent implements OnInit {
  constructor(private route: Router, private http: HttpService) {}

  carousels: SearchHomeCarouselModel[] = [];

  ngOnInit(): void {
    this.searchCarousel();
  }

  searchCarousel() {
    this.http
      .get<SearchHomeCarouselModelListResponseData>(
        `${environment.apiUrl}Carousel/SearchCarouselPictures`
      )
      .subscribe((x) => {
        this.carousels = x.data ?? [];
      });
  }

  deleteCarousel(targetCarousel: SearchHomeCarouselModel) {
    this.http
      .delete<HomeCarouselResponseData>(
        `${environment.apiUrl}Carousel/DeleteCarousel`,
        {
          carouselId: targetCarousel.id,
        }
      )
      .subscribe((x) => {
        this.carousels = this.carousels.filter(
          (x) => x.id != targetCarousel.id
        );
      });
  }

  editCarouselSort(direction: string, carousel: SearchHomeCarouselModel) {
    this.http
      .put<ApiResponse>(
        `${environment.apiUrl}Carousel/EditPictureSort/${direction}`,
        carousel
      )
      .subscribe((x) => {
        this.searchCarousel();
      });
  }

  changeCarouselStatus(carousel: SearchHomeCarouselModel) {
    this.http
      .put<ApiResponse>(
        `${environment.apiUrl}Carousel/EditCarouselStatus/${carousel.id}`,
        null
      )
      .subscribe((x) => {
        carousel.status = !carousel.status;
      });
  }
}
