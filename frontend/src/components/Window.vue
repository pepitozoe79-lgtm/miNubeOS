<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { X, Minus, Square } from 'lucide-vue-next';
import { useDesktopStore, type WindowApp } from '../stores/desktop';

const props = defineProps<{
  appId: WindowApp;
  title: string;
  noPadding?: boolean;
}>();

const desktop = useDesktopStore();
const win = desktop.windows[props.appId];

// --- Window actions ---
const handleClose = () => desktop.closeWindow(props.appId);
const handleMinimize = () => desktop.toggleMinimize(props.appId);
const handleMaximize = () => desktop.toggleMaximize(props.appId);
const handleFocus = () => desktop.focusWindow(props.appId);

// --- Drag logic ---
const isDragging = ref(false);
let dragOffsetX = 0;
let dragOffsetY = 0;

const onDragStart = (e: MouseEvent) => {
  // Don't drag if clicking on controls or if maximized
  if ((e.target as HTMLElement).closest('.window-controls')) return;
  if (win.isMaximized) return;

  isDragging.value = true;
  dragOffsetX = e.clientX - win.x;
  dragOffsetY = e.clientY - win.y;

  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
  
  handleFocus();
};

const onDragMove = (e: MouseEvent) => {
  if (!isDragging.value) return;
  
  const newX = e.clientX - dragOffsetX;
  const newY = e.clientY - dragOffsetY;
  
  // Constrain to viewport (keep at least 100px visible)
  const clampedX = Math.max(-400, Math.min(window.innerWidth - 100, newX));
  const clampedY = Math.max(0, Math.min(window.innerHeight - 40, newY));
  
  desktop.moveWindow(props.appId, clampedX, clampedY);
};

const onDragEnd = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);
};

onUnmounted(() => {
  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);
});
</script>

<template>
  <div 
    v-if="win.isOpen" 
    class="window-frame glass"
    :class="{ hidden: win.isMinimized, maximized: win.isMaximized, dragging: isDragging }"
    :style="{ 
      zIndex: win.zIndex,
      left: win.isMaximized ? '0px' : win.x + 'px',
      top: win.isMaximized ? '0px' : win.y + 'px'
    }"
    @mousedown="handleFocus"
  >
    <div class="window-header" @mousedown="onDragStart" @dblclick="handleMaximize">
      <div class="window-title">{{ title }}</div>
      <div class="window-controls">
        <button @click.stop="handleMinimize" class="control-btn min" title="Minimizar"><Minus :size="14"/></button>
        <button @click.stop="handleMaximize" class="control-btn max" title="Maximizar"><Square :size="10"/></button>
        <button @click.stop="handleClose" class="control-btn close" title="Cerrar"><X :size="14"/></button>
      </div>
    </div>
    <div class="window-content" :class="{ 'no-padding': noPadding }">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.window-frame {
  position: absolute;
  width: 900px;
  height: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.1);
  transition: width 0.3s, height 0.3s, box-shadow 0.3s, border-radius 0.3s, border 0.3s, opacity 0.2s;
}

/* Disable transition during drag for instant response */
.window-frame.dragging {
  transition: none;
}

/* Maximized state */
.window-frame.maximized {
  width: 100% !important;
  height: 100% !important;
  border-radius: 0;
  box-shadow: none;
  border: none;
}

/* Minimized state */
.window-frame.hidden {
  opacity: 0;
  pointer-events: none;
  transform: scale(0.95);
}

.window-header {
  height: 40px;
  min-height: 40px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  cursor: grab;
  user-select: none;
}

.window-header:active {
  cursor: grabbing;
}

.window-frame.maximized .window-header {
  cursor: default;
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
  transition: all 0.15s ease;
  cursor: pointer;
}

.control-btn:hover { background: rgba(255,255,255,0.1); color: white; }
.control-btn.max:hover { background: rgba(34, 197, 94, 0.3); color: #22c55e; }
.control-btn.close:hover { background: #ef4444; }

.window-content {
  flex: 1;
  background: var(--bg-main);
  overflow: auto;
  padding: 1.5rem;
}

.window-content.no-padding {
  padding: 0;
}
</style>
