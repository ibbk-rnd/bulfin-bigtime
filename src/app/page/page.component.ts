import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';
import { marked, RendererObject } from 'marked';
import { RouterLink } from '@angular/router';
import { IconsModule } from '../icons.module';

@Component({
  selector: 'app-page',
  imports: [IconsModule, RouterLink],
  templateUrl: './page.component.html',
})
export class PageComponent implements OnInit {
  public html = '';
  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.dataService.getPage('about').subscribe((response: any) => {
      const renderer = {
        link(href: any, title: any, text: any) {
          const link = marked.Renderer.prototype.link.call(this, href);
          return link.replace('<a', "<a target='_blank' class='text-decoration-none' ");
        },
      } as RendererObject;

      marked.use({ renderer });

      this.html = marked.parse(response).toString();
      this.cdr.detectChanges();
    });
  }
}
