import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { first } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GatewaysService {
  baseUrl = 'http://127.0.0.1:3000/gateways';

  constructor(private http: HttpClient) { }

  index() {
    return this.http.get(this.baseUrl).pipe(first());
  }

  store(body: any) {
    return this.http.post(this.baseUrl, body).pipe(first());
  }

  show(uuid: string) {
    return this.http.get(`${this.baseUrl}/${uuid}`).pipe(first());
  }

  update(uuid: string, body: any) {
    return this.http.put(`${this.baseUrl}/${uuid}`, body).pipe(first());
  }

  delete(uuid: string) {
    return this.http.delete(`${this.baseUrl}/${uuid}`).pipe(first());
  }
}