import { Service, inject, computed } from '@angular/core';
import { UserStore } from '../store/user-store';

@Service()
export class UserService {
  private store = inject(UserStore);

  readonly users = computed(() => this.store.users());
  readonly loading = computed(() => this.store.usersLoading());

  private userUpdateListenerBound = false;
  private newUserListenerBound = false;

  private listening = false;

  /**
   * Loads the list of users from the server and updates the `users` signal.
   */
  loadUsers() {
    this.store.loadUsers();
  }

  listenForUserUpdates() {
    if (this.userUpdateListenerBound) return;
    this.userUpdateListenerBound = true;

    this.store.listenForUserUpdates();
  }

  listenForNewUsers() {
    if (this.newUserListenerBound) return;
    this.newUserListenerBound = true;

    this.store.listenForNewUser();
  }

  /**
   * Listens for presence changes and updates the user list accordingly.
   */
  listenForPresence() {
    if (this.listening) return;
    this.listening = true;

    this.store.listenForPresence();
  }

  /**
   * Clears the list of users, resetting the `users` signal to an empty array.
   */
  clearUsers() {
    this.store.clearUsers();
  }
}
