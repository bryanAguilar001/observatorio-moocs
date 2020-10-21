import { Injectable } from '@angular/core';
import { GoogleSheetsDbService } from 'ng-google-sheets-db';
import { Subscription } from 'rxjs';

import { Record, attributesMapping } from '../models/record.model';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  public data: Record[] = [];
  private subscription: Subscription;

  constructor(private googleSheetsDbService: GoogleSheetsDbService) {
    // this.getData();
   }

  getData() {
    return this.googleSheetsDbService.get<Record>(
      environment.document.spreadsheetId, 
      environment.document.worksheetId, 
      attributesMapping
      );
  }
}