import {ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot} from '@angular/router';
import { Chat } from '../../features/chat/models/chat';
import { inject } from '@angular/core';
import { ChatService } from '../../features/chat/services/chat-service';

export const chatResolver: ResolveFn<Chat> = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
) => {
    const chatService = inject(ChatService);
    const chatId = route.paramMap.get('id')!;
    return chatService.getChat(chatId);
};
