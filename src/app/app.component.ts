import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import * as moment from 'moment';
import 'moment/locale/bg';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor() {
    moment.locale('bg');
  }
}
