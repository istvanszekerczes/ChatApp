import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth';

/**
 * A guard that checks if the user is authenticated before allowing access to a route.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.loadCurrentUser().pipe(
    map(user => (user ? true : router.parseUrl('/login'))),
    catchError(() => of(router.parseUrl('/login')))
  );
};