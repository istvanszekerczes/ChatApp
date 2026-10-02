import { inject, Pipe, PipeTransform } from '@angular/core';
import { UserStore } from '../../users/store/user-store';

@Pipe({
  name: 'lastSender',
})
export class LastSenderPipe implements PipeTransform {
  userStore = inject(UserStore);
  transform(value: string): string {
    const userName = this.userStore.currentUser()?.username;
    return userName === value ? 'You' : value;
  }
}
