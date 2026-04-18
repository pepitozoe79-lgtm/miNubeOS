<script setup lang="ts">
import { ref } from 'vue';
import { useNotificationStore, type AppNotification } from '../stores/notifications';
import { Bell, X, Info, CheckCircle, AlertTriangle, XCircle, Trash2, MailOpen } from 'lucide-vue-next';

const notifStore = useNotificationStore();
const showDropdown = ref(false);

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
  if (showDropdown.value && notifStore.unreadCount > 0) {
    // maybe don't mark as read immediately, let user see them
  }
};

const closeDropdown = () => {
  showDropdown.value = false;
};

const getIcon = (type: string) => {
  switch (type) {
    case 'success': return CheckCircle;
    case 'warning': return AlertTriangle;
    case 'error': return XCircle;
    default: return Info;
  }
};

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(date);
};
</script>

<template>
  <div class="notification-center">
    <!-- Bell Button -->
    <button class="icon-btn bell-btn" @click="toggleDropdown" :class="{ active: showDropdown }">
      <Bell :size="18" />
      <div v-if="notifStore.unreadCount > 0" class="unread-badge">{{ notifStore.unreadCount }}</div>
    </button>

    <!-- Dropdown Panel -->
    <div v-if="showDropdown" class="notif-dropdown glass fade-in">
      <header class="notif-header">
        <h3>Notificaciones</h3>
        <div class="header-actions">
          <button @click="notifStore.markAllAsRead" title="Marcar todas como leídas" class="text-btn">
            <MailOpen :size="14" />
          </button>
          <button @click="notifStore.clearAll" title="Limpiar todo" class="text-btn">
            <Trash2 :size="14" />
          </button>
        </div>
      </header>

      <div class="notif-list">
        <div v-if="notifStore.notifications.length === 0" class="notif-empty">
          <Bell :size="32" />
          <p>No tienes notificaciones</p>
        </div>

        <div 
          v-for="notif in notifStore.notifications" 
          :key="notif.id" 
          class="notif-item" 
          :class="[notif.type, { unread: !notif.read }]"
          @click="notifStore.markAsRead(notif.id)"
        >
          <div class="notif-icon-box">
            <component :is="getIcon(notif.type)" :size="18" />
          </div>
          <div class="notif-content">
            <div class="notif-top">
              <span class="notif-title">{{ notif.title }}</span>
              <span class="notif-time">{{ formatTime(notif.timestamp) }}</span>
            </div>
            <p class="notif-msg">{{ notif.message }}</p>
          </div>
          <div v-if="!notif.read" class="unread-dot"></div>
        </div>
      </div>
    </div>

    <!-- Overlay to close -->
    <div v-if="showDropdown" class="notif-overlay" @click="closeDropdown"></div>
  </div>
</template>

<style scoped>
.notification-center {
  position: relative;
}

.bell-btn {
  position: relative;
}

.unread-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid #1e293b;
}

.notif-dropdown {
  position: absolute;
  top: 130%;
  right: -100px;
  width: 320px;
  max-height: 480px;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  z-index: 1001;
}

.notif-header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.notif-header h3 {
  font-size: 0.95rem;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.text-btn {
  background: transparent;
  color: #94a3b8;
  padding: 4px;
}

.text-btn:hover { color: white; }

.notif-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.notif-empty {
  padding: 3rem 1rem;
  text-align: center;
  color: #64748b;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.notif-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 2px;
  position: relative;
}

.notif-item:hover { background: rgba(255, 255, 255, 0.05); }
.notif-item.unread { background: rgba(99, 102, 241, 0.05); }

.notif-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info .notif-icon-box { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.success .notif-icon-box { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
.warning .notif-icon-box { background: rgba(234, 179, 8, 0.1); color: #eab308; }
.error .notif-icon-box { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

.notif-content {
  flex: 1;
  min-width: 0;
}

.notif-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.notif-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: white;
}

.notif-time {
  font-size: 0.7rem;
  color: #64748b;
}

.notif-msg {
  font-size: 0.8rem;
  color: #94a3b8;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.unread-dot {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 6px;
  height: 6px;
  background: #6366f1;
  border-radius: 50%;
}

.notif-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
}
</style>
