import { defineStore } from 'pinia';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timeout?: number;
}

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [] as Notification[],
  }),
  actions: {
    notify(notification: Omit<Notification, 'id'>) {
      const id = Math.random().toString(36).substring(2, 9);
      const newNotification = { ...notification, id };
      this.notifications.push(newNotification);

      const timeout = notification.timeout || 5000;
      if (timeout > 0) {
        setTimeout(() => {
          this.remove(id);
        }, timeout);
      }
    },
    success(title: string, message: string) {
      this.notify({ title, message, type: 'success' });
    },
    error(title: string, message: string) {
      this.notify({ title, message, type: 'error' });
    },
    info(title: string, message: string) {
      this.notify({ title, message, type: 'info' });
    },
    warning(title: string, message: string) {
      this.notify({ title, message, type: 'warning' });
    },
    remove(id: string) {
      this.notifications = this.notifications.filter(n => n.id !== id);
    }
  }
});
