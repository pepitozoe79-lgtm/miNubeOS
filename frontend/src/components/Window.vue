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

// --- Resize logic ---
const isResizing = ref<'t' | 'b' | 'l' | 'r' | 'tl' | 'tr' | 'bl' | 'br' | null>(null);
let resizeStartWidth = 0;
let resizeStartHeight = 0;
let resizeStartX = 0;
let resizeStartY = 0;
let resizeStartXPos = 0;
let resizeStartYPos = 0;

const onResizeStart = (type: 't' | 'b' | 'l' | 'r' | 'tl' | 'tr' | 'bl' | 'br', e: MouseEvent) => {
  if (win.isMaximized) return;
  e.preventDefault();
  e.stopPropagation();
  
  isResizing.value = type;
  resizeStartWidth = win.width;
  resizeStartHeight = win.height;
  resizeStartX = e.clientX;
  resizeStartY = e.clientY;
  resizeStartXPos = win.x;
  resizeStartYPos = win.y;

  document.addEventListener('mousemove', onResizeMove);
  document.addEventListener('mouseup', onResizeEnd);
};

const onResizeMove = (e: MouseEvent) => {
  if (!isResizing.value) return;

  const deltaX = e.clientX - resizeStartX;
  const deltaY = e.clientY - resizeStartY;

  let newWidth = resizeStartWidth;
  let newHeight = resizeStartHeight;
  let newX = win.x;
  let newY = win.y;

  // Handle Horizontal
  if (['r', 'tr', 'br'].includes(isResizing.value)) {
    newWidth = Math.max(300, resizeStartWidth + deltaX);
  } else if (['l', 'tl', 'bl'].includes(isResizing.value)) {
    const potentialWidth = resizeStartWidth - deltaX;
    if (potentialWidth > 300) {
      newWidth = potentialWidth;
      newX = resizeStartXPos + deltaX;
    }
  }

  // Handle Vertical
  if (['b', 'bl', 'br'].includes(isResizing.value)) {
    newHeight = Math.max(200, resizeStartHeight + deltaY);
  } else if (['t', 'tl', 'tr'].includes(isResizing.value)) {
    const potentialHeight = resizeStartHeight - deltaY;
    if (potentialHeight > 200) {
      newHeight = potentialHeight;
      newY = resizeStartYPos + deltaY;
    }
  }

  desktop.resizeWindow(props.appId, newWidth, newHeight);
  desktop.moveWindow(props.appId, newX, newY);
};

const onResizeEnd = () => {
  isResizing.value = null;
  document.removeEventListener('mousemove', onResizeMove);
  document.removeEventListener('mouseup', onResizeEnd);
};

onUnmounted(() => {
  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);
  document.removeEventListener('mousemove', onResizeMove);
  document.removeEventListener('mouseup', onResizeEnd);
});
</script>

<template>
  <div 
    v-if="win.isOpen" 
    class="window-frame glass"
    :class="{ hidden: win.isMinimized, maximized: win.isMaximized, dragging: isDragging || isResizing }"
    :style="{ 
      zIndex: win.zIndex,
      left: win.isMaximized ? '0px' : win.x + 'px',
      top: win.isMaximized ? '0px' : win.y + 'px',
      width: win.isMaximized ? '100%' : win.width + 'px',
      height: win.isMaximized ? '100%' : win.height + 'px'
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

    <!-- Resizing handles -->
    <template v-if="!win.isMaximized">
      <div class="resize-handle t" @mousedown="onResizeStart('t', $event)"></div>
      <div class="resize-handle b" @mousedown="onResizeStart('b', $event)"></div>
      <div class="resize-handle l" @mousedown="onResizeStart('l', $event)"></div>
      <div class="resize-handle r" @mousedown="onResizeStart('r', $event)"></div>
      <div class="resize-handle tl" @mousedown="onResizeStart('tl', $event)"></div>
      <div class="resize-handle tr" @mousedown="onResizeStart('tr', $event)"></div>
      <div class="resize-handle bl" @mousedown="onResizeStart('bl', $event)"></div>
      <div class="resize-handle br" @mousedown="onResizeStart('br', $event)"></div>
    </template>
  </div>
</template>

<style scoped>
.window-frame {
  position: absolute;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.1);
  transition: box-shadow 0.3s, border-radius 0.3s, border 0.3s, opacity 0.2s;
  border-radius: 12px;
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

/* Resize Handles */
.resize-handle {
  position: absolute;
  z-index: 100;
  background: transparent;
}
.resize-handle.t {
  top: 0; left: 0; width: 100%; height: 4px;
  cursor: ns-resize;
}
.resize-handle.b {
  bottom: 0; left: 0; width: 100%; height: 4px;
  cursor: ns-resize;
}
.resize-handle.l {
  top: 0; left: 0; width: 4px; height: 100%;
  cursor: ew-resize;
}
.resize-handle.r {
  top: 0; right: 0; width: 4px; height: 100%;
  cursor: ew-resize;
}
.resize-handle.tl {
  top: 0; left: 0; width: 10px; height: 10px;
  cursor: nwse-resize;
  z-index: 101;
}
.resize-handle.tr {
  top: 0; right: 0; width: 10px; height: 10px;
  cursor: nesw-resize;
  z-index: 101;
}
.resize-handle.bl {
  bottom: 0; left: 0; width: 10px; height: 10px;
  cursor: nesw-resize;
  z-index: 101;
}
.resize-handle.br {
  bottom: 0; right: 0; width: 10px; height: 10px;
  cursor: nwse-resize;
  z-index: 101;
}
</style>
