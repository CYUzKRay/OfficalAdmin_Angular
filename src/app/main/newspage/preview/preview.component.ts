import { Component } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpService } from 'src/app/share/service/http.service';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.css'],
})
export class PreviewComponent {
  html: SafeHtml = '';
  newId: string = '';
  constructor(
    private router: Router,
    private http: HttpService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute
  ) {
    route.paramMap.subscribe((x) => {
      this.newId = x.get('id')!;
      // console.log(x.get('id'));
      this.http
        .get(`http://localhost:5133/api/News/PreviewNew/${this.newId}`)
        .subscribe((x: any) => {
          this.html = x.data.newContent;
        });
    });
  }
}
