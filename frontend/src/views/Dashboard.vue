<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useDesktopStore, type WindowApp } from '../stores/desktop';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { 
  Folder, 
  Settings, 
  Activity, 
  User, 
  Bell,
  Search,
  Grid,
  LayoutDashboard
} from 'lucide-vue-next';
import Window from '../components/Window.vue';
import Files from './Files.vue';
import Apps from './Apps.vue';
import Home from './Home.vue';
import ControlPanel from './ControlPanel.vue';

const auth = useAuthStore();
const desktop = useDesktopStore();
const router = useRouter();

const stats = ref({ cpu: 0, ram: 0, disk: 0 });

// Get list of open windows for the taskbar
const openWindows = computed(() => {
  return Object.values(desktop.windows).filter(w => w.isOpen);
});

const handleTaskbarClick = (appId: WindowApp) => {
  const win = desktop.windows[appId];
  if (win.isMinimized) {
    // Restore if minimized
    desktop.toggleMinimize(appId);
  } else if (win.zIndex === desktop.topZIndex) {
    // Minimize if it's the active window
    desktop.toggleMinimize(appId);
  } else {
    // Focus if it's behind another window
    desktop.focusWindow(appId);
  }
};

const fetchStats = async () => {
  try {
    const res = await axios.get('/api/system/stats');
    stats.value = res.data;
  } catch (err) {
    console.error('Error fetching stats');
  }
};

let statsInterval: any;

onMounted(() => {
  fetchStats();
  statsInterval = setInterval(fetchStats, 5000);
});

onUnmounted(() => {
  clearInterval(statsInterval);
});

const handleLogout = () => {
  auth.logout();
  router.push('/login');
};

const openApp = (appId: any) => {
  desktop.openWindow(appId);
};
</script>

<template>
  <div 
    class="desktop-container" 
    :style="{ backgroundImage: `url(${desktop.wallpaper})` }"
  >
    <!-- Top Bar -->
    <header class="top-bar glass">
      <div class="top-left">
        <button class="menu-btn"><Grid :size="20" /></button>
        <div class="logo-container">
          <img src="../assets/logo.png" alt="Logo" class="top-logo" />
          <span class="os-name">NubeOS</span>
        </div>
      </div>

      <!-- Taskbar: open windows -->
      <div class="taskbar">
        <button 
          v-for="win in openWindows" 
          :key="win.id"
          class="taskbar-item"
          :class="{ active: !win.isMinimized && win.zIndex === desktop.topZIndex, minimized: win.isMinimized }"
          @click="handleTaskbarClick(win.id)"
          :title="win.title"
        >
          <Folder v-if="win.id === 'files'" :size="16" />
          <LayoutDashboard v-else-if="win.id === 'apps'" :size="16" />
          <Activity v-else-if="win.id === 'monitor'" :size="16" />
          <Settings v-else :size="16" />
          <span class="taskbar-label">{{ win.title }}</span>
        </button>
      </div>
      
      <div class="top-right">
        <button class="icon-btn"><Search :size="18"/></button>
        <button class="icon-btn"><Bell :size="18"/></button>
        <div class="time">{{ new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</div>
        <div class="user-pill glass" @click="handleLogout">
          <User :size="16"/>
          <span>{{ auth.user?.username }}</span>
        </div>
      </div>
    </header>

    <!-- Desktop Icons -->
    <main class="desktop-area">
      <div class="icon-grid">
        <div class="desktop-icon" @click="openApp('files')">
          <div class="icon-box blue"><Folder :size="32" /></div>
          <span>Archivos</span>
        </div>
        
        <div class="desktop-icon" @click="openApp('apps')">
          <div class="icon-box purple"><LayoutDashboard :size="32" /></div>
          <span>App Center</span>
        </div>

        <div class="desktop-icon" @click="openApp('monitor')">
          <div class="icon-box green"><Activity :size="32" /></div>
          <span>Monitor</span>
        </div>

        <div class="desktop-icon" @click="openApp('admin')">
          <div class="icon-box grey"><Settings :size="32" /></div>
          <span>Panel Control</span>
        </div>
      </div>

      <!-- Windows -->
      <Window appId="files" title="Explorador de Archivos">
        <Files />
      </Window>

      <Window appId="apps" title="Centro de Aplicaciones">
        <Apps />
      </Window>

      <Window appId="monitor" title="Monitor del Sistema">
        <Home />
      </Window>

      <Window appId="admin" title="Panel de Control">
        <ControlPanel />
      </Window>
      
      <!-- Resource Widget (Like in TOS) -->
      <aside class="resource-widget glass">
        <div class="widget-header">Estado del Sistema</div>
        <div class="widget-item">
          <div class="label">CPU</div>
          <div class="bar-container"><div class="bar" :style="{ width: stats.cpu + '%' }"></div></div>
          <div class="val">{{ stats.cpu }}%</div>
        </div>
        <div class="widget-item">
          <div class="label">RAM</div>
          <div class="bar-container"><div class="bar" :style="{ width: stats.ram + '%' }"></div></div>
          <div class="val">{{ stats.ram }}%</div>
        </div>
        <div class="widget-item">
          <div class="label">Disco</div>
          <div class="bar-container"><div class="bar" :style="{ width: stats.disk + '%' }"></div></div>
          <div class="val">{{ stats.disk }}%</div>
        </div>
      </aside>
    </main>
  </div>
</template>

<style scoped>
.desktop-container {
  width: 100vw;
  height: 100vh;
  background: url('../assets/wallpaper.png') no-repeat center center;
  background-size: cover;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: white;
}

.top-bar {
  height: 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-top: none;
  z-index: 1000;
}

.top-left, .top-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-shrink: 0;
}

/* Taskbar */
.taskbar {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0 1rem;
  overflow-x: auto;
}

.taskbar-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  position: relative;
  border: 1px solid transparent;
}

.taskbar-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.taskbar-item.active {
  background: rgba(99, 102, 241, 0.15);
  color: white;
  border-color: rgba(99, 102, 241, 0.3);
}

.taskbar-item.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 3px;
  background: var(--primary);
  border-radius: 2px;
}

.taskbar-item.minimized {
  opacity: 0.5;
}

.taskbar-item.minimized:hover {
  opacity: 0.85;
}

.taskbar-label {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.os-name { font-weight: 800; font-size: 1.1rem; }

.logo-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.top-logo {
  height: 28px;
  width: auto;
  object-fit: contain;
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.85rem;
  cursor: pointer;
}

.desktop-area {
  flex: 1;
  position: relative;
  padding: 2rem;
}

.icon-grid {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(auto-fill, 100px);
  gap: 2rem;
  width: min-content;
}

.desktop-icon {
  width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  text-align: center;
}

.desktop-icon span {
  font-size: 0.75rem;
  font-weight: 500;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
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
}

.desktop-icon:hover .icon-box { transform: scale(1.05); }

.icon-box.blue { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
.icon-box.purple { background: linear-gradient(135deg, #a855f7, #6d28d9); }
.icon-box.green { background: linear-gradient(135deg, #22c55e, #15803d); }
.icon-box.grey { background: linear-gradient(135deg, #64748b, #334155); }

.resource-widget {
  position: absolute;
  top: 2rem;
  right: 2rem;
  width: 240px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.widget-header {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border);
}

.widget-item {
  display: grid;
  grid-template-columns: 40px 1fr 30px;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8rem;
}

.bar-container {
  height: 6px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: var(--primary);
}

.val { font-weight: 700; text-align: right; }
</style>
