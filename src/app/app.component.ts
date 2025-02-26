import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import moment from 'moment';
import 'moment/locale/bg';
import { FooterComponent } from './footer/footer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FooterComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  constructor() {
    moment.locale('bg');
  }
}
