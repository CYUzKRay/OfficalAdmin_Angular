import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from 'src/app/share/service/http.service';
import { HomePageManage } from './manage';
import { ResponseData } from 'src/app/share/models/ResponseData';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.css'],
})
export class ManageComponent implements OnInit {
  constructor(private route: Router, private http: HttpService) {}

  carousels: HomePageManage[] = [];

  ngOnInit(): void {
    this.searchCarousel();
  }

  searchCarousel() {
    this.http
      .get<ResponseData<HomePageManage[]>>(
        `${environment.apiUrl}Carousel/SearchCarouselPictures`
      )
      .subscribe((x) => {
        this.carousels = x.data;
      });
  }

  deleteCarousel(targetCarousel: HomePageManage) {
    this.http
      .delete<ResponseData<HomePageManage>>(
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

  editCarouselSort(direction: string, carousel: HomePageManage) {
    this.http
      .put<ResponseData<HomePageManage>>(
        `${environment.apiUrl}Carousel/EditPictureSort/${direction}`,
        carousel
      )
      .subscribe((x) => {
        this.searchCarousel();
      });
  }

  changeCarouselStatus(carousel: HomePageManage) {
    this.http
      .put<Boolean>(
        `${environment.apiUrl}Carousel/EditCarouselStatus/${carousel.id}`,
        null
      )
      .subscribe((x) => {
        carousel.status = !carousel.status;
      });
  }
}
