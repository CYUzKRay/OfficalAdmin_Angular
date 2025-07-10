import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  data = {
    Account: '',
    Password: '',
  };

  constructor(private http: HttpClient) {}

  Login() {}
}
