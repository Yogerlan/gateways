import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { first } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DevicesService {
  baseUrl = 'http://127.0.0.1:3000/devices';

  constructor(private http: HttpClient) { }

  index() {
    return this.http.get(this.baseUrl).pipe(first());
  }

  store(body: any) {
    return this.http.post(this.baseUrl, body).pipe(first());
  }

  show(uid: number) {
    return this.http.get(`${this.baseUrl}/${uid}`).pipe(first());
  }

  update(uid: number, body: any) {
    return this.http.put(`${this.baseUrl}/${uid}`, body).pipe(first());
  }

  delete(uid: number) {
    return this.http.delete(`${this.baseUrl}/${uid}`).pipe(first());
  }
}