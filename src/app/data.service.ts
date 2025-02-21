import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private http: HttpClient) {}

  getData(path: string): Observable<any> {
    return this.http.get<any>('data/' + path);
  }

  getPage(pageName: string): Observable<any> {
    return this.http.get(`pages/${pageName}.md`, { responseType: 'text' });
  }

  getKnowledge(pageName: string): Observable<any> {
    return this.http.get(`knowledge-base/${pageName}.md`, { responseType: 'text' });
  }
}
