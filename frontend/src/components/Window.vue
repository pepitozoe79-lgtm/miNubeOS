<script setup lang="ts">
import { X, Minus, Square } from 'lucide-vue-next';
import { useDesktopStore, type WindowApp } from '../stores/desktop';

const props = defineProps<{
  appId: WindowApp;
  title: string;
}>();

const desktop = useDesktopStore();
const win = desktop.windows[props.appId];

const handleClose = () => desktop.closeWindow(props.appId);
const handleMinimize = () => desktop.toggleMinimize(props.appId);
const handleFocus = () => desktop.focusWindow(props.appId);
</script>

<template>
  <div 
    v-if="win.isOpen" 
    class="window-frame glass"
    :class="{ hidden: win.isMinimized }"
    :style="{ zIndex: win.zIndex }"
    @mousedown="handleFocus"
  >
    <div class="window-header">
      <div class="window-title">{{ title }}</div>
      <div class="window-controls">
        <button @click="handleMinimize" class="control-btn min"><Minus :size="14"/></button>
        <button class="control-btn max"><Square :size="10"/></button>
        <button @click="handleClose" class="control-btn close"><X :size="14"/></button>
      </div>
    </div>
    <div class="window-content">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.window-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 900px;
  height: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.1);
  transition: opacity 0.2s, transform 0.2s;
}

.window-frame.hidden {
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, -40%) scale(0.95);
}

.window-header {
  height: 40px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  cursor: default;
  user-select: none;
}

.window-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
}

.window-controls {
  display: flex;
  gap: 0.5rem;
}

.control-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--text-muted);
}

.control-btn:hover { background: rgba(255,255,255,0.1); color: white; }
.control-btn.close:hover { background: #ef4444; }

.window-content {
  flex: 1;
  background: var(--bg-main);
  overflow: auto;
  padding: 1.5rem;
}
</style>
