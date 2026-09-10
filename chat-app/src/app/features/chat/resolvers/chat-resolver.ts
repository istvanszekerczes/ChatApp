import {ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot, Router} from '@angular/router';
import { Chat } from '../models/chat';
import { inject } from '@angular/core';
import { ChatService } from '../services/chat-service';
import { catchError, of } from 'rxjs';

export const chatResolver: ResolveFn<Chat | null> = (
    route: ActivatedRouteSnapshot,
) => {
    const chatService = inject(ChatService);
    const router = inject(Router);
    const chatId = route.paramMap.get('id')!;
    if (!chatId) return of(null);
    return chatService.getChat(chatId).pipe(
    catchError(() => {
      router.navigateByUrl('/');
      return of(null);
    }),
  );
};
