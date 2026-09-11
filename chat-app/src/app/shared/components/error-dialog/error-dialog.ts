import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-error-dialog',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './error-dialog.html',
  styleUrl: './error-dialog.scss',
})
export class ErrorDialog {
  private dialogRef = inject(MatDialogRef<ErrorDialog>);
  private router = inject(Router);

  close() {
    this.dialogRef.close();
    this.router.navigate(['/'])
  }
}