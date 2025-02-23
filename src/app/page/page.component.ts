import { Component, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import { marked } from 'marked';
import { RouterLink } from '@angular/router';
import { IconsModule } from '../icons.module';
import { markedConfig } from '../services/markdown';

@Component({
  selector: 'app-page',
  imports: [IconsModule, RouterLink],
  templateUrl: './page.component.html',
})
export class PageComponent implements OnInit {
  public html = '';

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.getPage('about').subscribe((response: any) => {
      marked.use(markedConfig());

      this.html = marked.parse(response).toString();
    });
  }
}
