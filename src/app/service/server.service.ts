import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Server } from 'http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Status } from '../enum/status.enum';
import { CustomResponse } from '../interface/custom-response';

@Injectable({ providedIn: 'root' })
export class ServerService {
  private readonly apiUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) { }

  servers$ = <Observable<CustomResponse>> this.http.get<CustomResponse>(`${this.apiUrl}/server/list`)
    .pipe(
      tap(console.log),
      catchError(this.handleError)
    );

  save$ = (server: Server) => <Observable<CustomResponse>> this.http.post<CustomResponse>(`${this.apiUrl}/server/save`, server)
    .pipe(
      tap(console.log),
      catchError(this.handleError)
    );

  ping$ = (ipAddress: string) => <Observable<CustomResponse>> this.http.get<CustomResponse>(`${this.apiUrl}/server/ping/${ipAddress}`)
    .pipe(
      tap(console.log),
      catchError(this.handleError)
    );

  filter$ = (status: Status, response: CustomResponse) => <Observable<CustomResponse>> new Observable<CustomResponse>(
    subscriber => {
      console.log(response);
      subscriber.next(
        status === Status.ALL ? { ...response, message: `Servers filtered by ${status} status` } :
        {
          ...response,
          message: response.data.servers.filter(server => server.status === status).length > 0 ? `Server filtered by ${status.replace('_', ' ')} status` : `No servers of ${status} found`,
          data: { servers: response.data.servers.filter(server => server.status === status) }
        }
      );
      subscriber.complete();
    }
  )
    .pipe(
      tap(console.log),
      catchError(this.handleError)
    );

  delete$ = (id: number) => <Observable<CustomResponse>> this.http.delete<CustomResponse>(`${this.apiUrl}/server/delete/${id}`)
    .pipe(
      tap(console.log),
      catchError(this.handleError)
    );

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.log(error);
    return throwError(() => new Error(`An error occurred - Error code: ${error.status}`));
  }
}
