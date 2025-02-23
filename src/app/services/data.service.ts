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

  getPage(fileName: string): Observable<any> {
    return this.http.get(`pages/${fileName}.md`, { responseType: 'text' });
  }

  getKnowledge(fileName: string): Observable<any> {
    return this.http.get(`knowledge-base/${fileName}.md`, { responseType: 'text' });
  }
}
