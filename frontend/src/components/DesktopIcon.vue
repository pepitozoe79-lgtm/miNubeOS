<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Folder, LayoutDashboard, Activity, Settings, HardDrive, Terminal } from 'lucide-vue-next';
import { useDesktopStore, type DesktopIcon } from '../stores/desktop';
import { useFileStore } from '../stores/files';

const props = defineProps<{
  iconData: DesktopIcon;
}>();

const desktop = useDesktopStore();
const fileStore = useFileStore();

// Mapeo de iconos
const iconComponents: Record<string, any> = {
  Folder,
  LayoutDashboard,
  Activity,
  Settings,
  HardDrive,
  Terminal
};

// Drag State
const isDragging = ref(false);
const currentX = ref(props.iconData.x);
const currentY = ref(props.iconData.y);
let dragStartX = 0;
let dragStartY = 0;
let initialIconX = 0;
let initialIconY = 0;

const onMouseDown = (e: MouseEvent) => {
  if (e.button !== 0) return; // Only left click
  
  isDragging.value = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  initialIconX = props.iconData.x;
  initialIconY = props.iconData.y;
  
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
};

const onMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return;
  
  const deltaX = e.clientX - dragStartX;
  const deltaY = e.clientY - dragStartY;
  
  currentX.value = initialIconX + deltaX;
  currentY.value = initialIconY + deltaY;
};

const onMouseUp = () => {
  if (!isDragging.value) return;
  
  isDragging.value = false;
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
  
  // Snap to grid and save
  desktop.moveIcon(props.iconData.id, currentX.value, currentY.value);
  
  // Reset local current pos to state pos (which is snapped)
  currentX.value = desktop.desktopIcons[props.iconData.id].x;
  currentY.value = desktop.desktopIcons[props.iconData.id].y;
};

const handleClick = () => {
  if (!isDragging.value) {
    if (props.iconData.type === 'drive' && props.iconData.path) {
      desktop.openWindow('files');
      fileStore.navigateToPath(props.iconData.path);
    } else {
      desktop.openWindow(props.iconData.id as any);
    }
  }
};

onMounted(() => {
  currentX.value = props.iconData.x;
  currentY.value = props.iconData.y;
});

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
});
</script>

<template>
  <div 
    ref="iconRef"
    class="desktop-icon" 
    :class="{ dragging: isDragging }"
    :style="{ 
      left: (isDragging ? currentX : props.iconData.x) + 'px', 
      top: (isDragging ? currentY : props.iconData.y) + 'px' 
    }"
    @mousedown="onMouseDown"
    @click="handleClick"
  >
    <div class="icon-box" :class="props.iconData.color">
      <component :is="iconComponents[props.iconData.icon]" :size="32" />
    </div>
    <span>{{ props.iconData.label }}</span>
  </div>
</template>

<style scoped>
.desktop-icon {
  position: absolute;
  width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  text-align: center;
  user-select: none;
  z-index: 5;
  transition: transform 0.2s;
  pointer-events: auto;
}

.desktop-icon.dragging {
  z-index: 1000;
  transition: none;
  cursor: grabbing;
  opacity: 0.8;
}

.desktop-icon span {
  font-size: 0.75rem;
  font-weight: 500;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  pointer-events: none;
}

.icon-box {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: transform 0.2s;
  pointer-events: none;
}

.desktop-icon:hover .icon-box { transform: scale(1.05); }
.desktop-icon.dragging .icon-box { transform: scale(1.1); }

.icon-box.blue { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
.icon-box.purple { background: linear-gradient(135deg, #a855f7, #6d28d9); }
.icon-box.green { background: linear-gradient(135deg, #22c55e, #15803d); }
.icon-box.grey { background: linear-gradient(135deg, #64748b, #334155); }
.icon-box.orange { background: linear-gradient(135deg, #f97316, #c2410c); }
.icon-box.dark { background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid rgba(88, 166, 255, 0.15); }
</style>
