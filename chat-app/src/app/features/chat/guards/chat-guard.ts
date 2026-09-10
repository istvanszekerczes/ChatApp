import { CanActivateFn, Router } from '@angular/router';
import { ChatService } from '../services/chat-service';
import { inject, computed } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Chat } from '../models/chat';

export const chatGuard: CanActivateFn = (route, state) => {
  const chatService = inject(ChatService);
  const chatId = route.paramMap.get('id')!;
  const router = inject(Router);
  const chat = chatService.getChat(chatId);
  return true;
};
