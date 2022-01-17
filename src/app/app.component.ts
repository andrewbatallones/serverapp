import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { BehaviorSubject, catchError, map, Observable, of, startWith } from 'rxjs';
import { DataState } from './enum/data-state.enum';
import { Status } from './enum/status.enum';
import { AppState } from './interface/app-state';
import { CustomResponse } from './interface/custom-response';
import { ServerService } from './service/server.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  readonly DataState = DataState;
  readonly Status = Status;
  private filterSubject = new BehaviorSubject<string>('');
  private dataSubject = new BehaviorSubject<CustomResponse>(null);
  private isLoading = new BehaviorSubject<boolean>(false);

  // This filterSubject is part of RXJS
  // TODO: deep dive - RXJS
  appState$: Observable<AppState<CustomResponse>>;
  filterStatus$ = this.filterSubject.asObservable();
  isLoading$ = this.isLoading.asObservable();

  constructor(private serverService: ServerService) {}

  ngOnInit(): void {
    this.appState$ = this.serverService.servers$
      .pipe(
        map(response => {
          this.dataSubject.next(response);
          return { dataState: DataState.LOADED_STATE, appData: { ...response, data: { servers: response.data.servers.reverse() } } }
        }),
        startWith({ dataState: DataState.LOADING_STATE }),
        catchError((error: string) => {
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }

  pingServer(ipAddress: string): void {
    this.filterSubject.next(ipAddress);

    // startsWith: when the method is called, what data is it starting with.
    this.appState$ = this.serverService.ping$(ipAddress)
      .pipe(
        map(response => {
          // find the location of the pinged server
          this.dataSubject.value.data.servers[
            this.dataSubject.value.data.servers.findIndex(server =>
              server.id === response.data.server.id)
          ] = response.data.server;
          // console.log(this.dataSubject.value);
          this.filterSubject.next('');
          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }

  saveServer(serverForm: NgForm): void {
    this.isLoading.next(true);
    this.appState$ = this.serverService.save$(serverForm.value)
      .pipe(
        map(response => {
          this.dataSubject.next(
            { ...response, data: { servers: [response.data.server, ...this.dataSubject.value.data.servers] } }
          );
          document.getElementById('new-server-form-close').click();
          this.isLoading.next(false);
          serverForm.resetForm({ status: this.Status.SERVER_DOWN });
          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.isLoading.next(false);
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }

  filterServers(event: Event): void {
    // response: is just the return value, not necessarily a response from a server
    // The one thing that's different from the Youtube tutorial.
    // (ngModelChange) has been deprecated, so you will instead need to use (input), which passes the event object
    // You can get the enum by getting the value of the target and [] selecting the appropriate enum.
    // You'll also need a 'selected' option or it will blow an error saying that there is no event passed.
    let status: Status = Status[(event.target as HTMLInputElement).value];
    this.appState$ = this.serverService.filter$(status, this.dataSubject.value)
      .pipe(
        map(response => {
          return { dataState: DataState.LOADED_STATE, appData: response }
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.filterSubject.next('');
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }
}
