import { defineStore } from 'pinia';
import { io, Socket } from 'socket.io-client';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    notifications: [] as AppNotification[],
    socket: null as Socket | null,
    unreadCount: 0
  }),

  actions: {
    init() {
      if (this.socket) return;

      const protocol = window.location.protocol;
      const host = window.location.hostname;
      const port = 3000;
      
      this.socket = io(`${protocol}//${host}:${port}`);

      this.socket.on('notification', (notif: AppNotification) => {
        this.addNotification(notif);
      });
    },

    addNotification(notif: AppNotification) {
      this.notifications.unshift({
        ...notif,
        timestamp: new Date(notif.timestamp)
      });
      if (!notif.read) this.unreadCount++;
      
      // Limit to 50 notifications
      if (this.notifications.length > 50) {
        this.notifications.pop();
      }
    },

    markAsRead(id: string) {
      const notif = this.notifications.find(n => n.id === id);
      if (notif && !notif.read) {
        notif.read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
    },

    markAllAsRead() {
      this.notifications.forEach(n => n.read = true);
      this.unreadCount = 0;
    },

    clearAll() {
      this.notifications = [];
      this.unreadCount = 0;
    }
  }
});
