import { inject, Pipe, PipeTransform } from '@angular/core';
import { UserStore } from '../../users/store/user-store';

@Pipe({
  name: 'lastSender',
})
export class LastSenderPipe implements PipeTransform {
  userStore = inject(UserStore);
  transform(value: string | null): string {
    const userName = this.userStore.currentUser()?.username;
    if (value == userName) {
      return 'You:'
    }
    return value + ':';
  }
}
