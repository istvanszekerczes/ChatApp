import { CanActivateFn, Router } from '@angular/router';
import { ChatService } from '../services/chat-service';
import { inject } from '@angular/core';
import { catchError, of, map } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

export const chatGuard: CanActivateFn = (route) => {
  const chatService = inject(ChatService);
  const chatId = route.paramMap.get('id')!;
  const router = inject(Router);

  return chatService.getChat(chatId).pipe(
    map(() => true),
    catchError((err: HttpErrorResponse) => {
      if (err.status === 404) {
        router.navigate(['/error']);
      }
      return of(false);
    }),
  );
};