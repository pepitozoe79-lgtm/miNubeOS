<script setup lang="ts">
import { useNotificationStore } from '../stores/notification';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-vue-next';

const notificationStore = useNotificationStore();

const getIcon = (type: string) => {
  switch (type) {
    case 'success': return CheckCircle2;
    case 'error': return AlertCircle;
    case 'warning': return AlertTriangle;
    default: return Info;
  }
};
</script>

<template>
  <div class="notification-container">
    <TransitionGroup name="toast">
      <div 
        v-for="note in notificationStore.notifications" 
        :key="note.id" 
        class="notification-toast glass"
        :class="note.type"
      >
        <div class="toast-icon">
          <component :is="getIcon(note.type)" :size="20" />
        </div>
        <div class="toast-content">
          <div class="toast-title">{{ note.title }}</div>
          <div class="toast-msg">{{ note.message }}</div>
        </div>
        <button class="toast-close" @click="notificationStore.remove(note.id)">
          <X :size="14" />
        </button>
        <div class="toast-progress">
          <div class="progress-bar"></div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.notification-container {
  position: fixed;
  top: 60px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.notification-toast {
  pointer-events: auto;
  min-width: 300px;
  max-width: 400px;
  padding: 1rem;
  padding-left: 1.25rem;
  border-radius: 16px;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
  overflow: hidden;
  position: relative;
}

.toast-icon {
  margin-top: 2px;
}

.success .toast-icon { color: #10b981; }
.error .toast-icon { color: #ef4444; }
.warning .toast-icon { color: #f59e0b; }
.info .toast-icon { color: #3b82f6; }

.toast-content {
  flex: 1;
}

.toast-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: white;
  margin-bottom: 2px;
}

.toast-msg {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.7);
  line-height: 1.4;
}

.toast-close {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.3);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
}

.toast-close:hover {
  background: rgba(255,255,255,0.1);
  color: white;
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: rgba(255,255,255,0.05);
}

.progress-bar {
  height: 100%;
  background: currentColor;
  opacity: 0.5;
  animation: progress linear 5s forwards;
}

@keyframes progress {
  from { width: 100%; }
  to { width: 0%; }
}

.success .progress-bar { background: #10b981; }
.error .progress-bar { background: #ef4444; }
.warning .progress-bar { background: #f59e0b; }
.info .progress-bar { background: #3b82f6; }

/* Transitions */
.toast-enter-active, .toast-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(50px) scale(0.9);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.9);
}
</style>
