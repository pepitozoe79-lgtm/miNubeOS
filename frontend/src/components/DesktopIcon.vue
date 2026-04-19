<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Folder, LayoutDashboard, Activity, Settings, HardDrive, Terminal, LogOut } from 'lucide-vue-next';
import { useDesktopStore, type DesktopIcon } from '../stores/desktop';
import { useFileStore } from '../stores/files';
import axios from 'axios';

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

// Sincronizar coords locales con props (evita el salto al empezar a arrastrar)
watch(() => [props.iconData.x, props.iconData.y], ([newX, newY]) => {
  if (!isDragging.value) {
    currentX.value = newX as number;
    currentY.value = newY as number;
  }
});

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

  // Actualizar posicin visual inmediatamente
  currentX.value = initialIconX + deltaX;
  currentY.value = initialIconY + deltaY;
};

const onMouseUp = (e: MouseEvent) => {
  if (!isDragging.value) return;
  
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
  
  // Calcular si hubo movimiento real
  const deltaX = e.clientX - dragStartX;
  const deltaY = e.clientY - dragStartY;
  const moved = Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5;

  // Snap to grid and save
  desktop.moveIcon(props.iconData.id, currentX.value, currentY.value);
  
  // Reset local current pos to state pos (which is snapped)
  currentX.value = desktop.desktopIcons[props.iconData.id].x;
  currentY.value = desktop.desktopIcons[props.iconData.id].y;

  // Mantener isDragging en true un instante para que handleClick lo ignore
  if (moved) {
    setTimeout(() => {
      isDragging.value = false;
    }, 100);
  } else {
    isDragging.value = false;
  }
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

// Context Menu State
const showMenu = ref(false);
const menuX = ref(0);
const menuY = ref(0);

const handleContextMenu = (e: MouseEvent) => {
  if (props.iconData.type !== 'drive') return;
  
  showMenu.value = true;
  menuX.value = e.clientX;
  menuY.value = e.clientY;
  
  window.addEventListener('click', closeMenu);
};

const closeMenu = () => {
  showMenu.value = false;
  window.removeEventListener('click', closeMenu);
};

const ejectDrive = async () => {
  try {
    const res = await axios.post('/api/system/eject-drive', { path: props.iconData.path });
    if (res.data.success) {
      // The drive will disappear in the next fetchDrives cycle in Dashboard.vue
      // But we can trigger a refresh via a global event or just wait.
      // For now, let's just show a notification if the store supported it
      console.log('Drive ejected');
    }
  } catch (err: any) {
    alert(err.response?.data?.error || 'Error al expulsar la unidad');
  }
  closeMenu();
};

onMounted(() => {
  currentX.value = props.iconData.x;
  currentY.value = props.iconData.y;
});

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
  window.removeEventListener('click', closeMenu);
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
    @contextmenu.prevent="handleContextMenu"
  >
    <div class="icon-box" :class="props.iconData.color">
      <component :is="iconComponents[props.iconData.icon]" :size="32" />
    </div>
    <span>{{ props.iconData.label }}</span>

    <!-- Mini Context Menu for Icon -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showMenu" class="icon-context-menu glass" :style="{ left: menuX + 'px', top: menuY + 'px' }" @click.stop>
          <div class="menu-item danger" @click="ejectDrive">
            <LogOut :size="14" /> Expulsar unidad
          </div>
        </div>
      </Transition>
    </Teleport>
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

.icon-context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 160px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 0.85rem;
  color: #e2e8f0;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.menu-item.danger {
  color: #f87171;
}

.menu-item.danger:hover {
  background: rgba(220, 38, 38, 0.2);
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
