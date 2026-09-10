import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { chatResolver } from './features/chat/resolvers/chat-resolver';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('../app/features/chat/pages/home/home').then((m) => m.Home),
  },
  {
    path: 'chat/:id',
    canActivate: [authGuard],
    resolve: {
      chat: chatResolver,
    },
    loadComponent: () => import('../app/features/chat/pages/home/home').then((m) => m.Home),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/pages/register/register').then((m) => m.Register),
  },
  {
    path: '**',
    loadComponent: () => import('../app/features/chat/pages/home/home').then((m) => m.Home),
  },
];
