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
  LayoutDashboard,
  LogOut,
  RotateCcw,
  Power,
  Terminal,
  CheckCircle2,
  Database
} from 'lucide-vue-next';
import Window from '../components/Window.vue';
import DesktopIcon from '../components/DesktopIcon.vue';
import Files from './Files.vue';
import Apps from './Apps.vue';
import Home from './Home.vue';
import ControlPanel from './ControlPanel.vue';
import TerminalView from './Terminal.vue';

const auth = useAuthStore();
const desktop = useDesktopStore();
const router = useRouter();

const stats = ref<any>({ cpu: 0, ram: 0, disk: 0, details: {} });
const showUserMenu = ref(false);
const currentVersion = ref<string | null>(null);

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value;
};

const closeUserMenu = () => {
  showUserMenu.value = false;
};

// Get list of open windows for the taskbar
const openWindows = computed(() => {
  return Object.values(desktop.windows).filter(w => w.isOpen);
});

const handleTaskbarClick = (appId: WindowApp) => {
  const win = desktop.windows[appId];
  if (win.isMinimized) {
    desktop.toggleMinimize(appId);
  } else if (win.zIndex === desktop.topZIndex) {
    desktop.toggleMinimize(appId);
  } else {
    desktop.focusWindow(appId);
  }
};

const fetchStats = async () => {
  try {
    const res = await axios.get('/api/system/stats');
    const data = res.data;
    
    // Auto-reload if version changed
    if (currentVersion.value && data.version !== currentVersion.value) {
      window.location.reload();
      return;
    }
    
    if (!currentVersion.value) currentVersion.value = data.version;
    stats.value = data;
  } catch (err) {
    console.error('Error fetching stats');
  }
};

const fetchExternalDrives = async () => {
  try {
    const res = await axios.get('/api/system/external-drives');
    const startX = 130; 
    const dynamicIcons = res.data.map((drive: any, index: number) => ({
      ...drive,
      x: startX + Math.floor(index / 5) * 110,
      y: (index % 5) * 120 + 20
    }));
    desktop.setDynamicIcons(dynamicIcons);
  } catch (err) {
    console.error('Error fetching external drives');
  }
};

let statsInterval: any;
let driveInterval: any;

onMounted(() => {
  fetchStats();
  fetchExternalDrives();
  statsInterval = setInterval(fetchStats, 5000);
  driveInterval = setInterval(fetchExternalDrives, 10000);
});

onUnmounted(() => {
  clearInterval(statsInterval);
  clearInterval(driveInterval);
});

const handleLogout = () => {
  auth.logout();
  router.push('/login');
};

const handleReboot = async () => {
  if (confirm('¿Estás seguro de que deseas reiniciar el equipo?')) {
    try {
      await axios.post('/api/system/reboot');
    } catch (err) {
      alert('Error al intentar reiniciar');
    }
  }
};

const handleShutdown = async () => {
  if (confirm('¿Estás seguro de que deseas apagar el equipo?')) {
    try {
      await axios.post('/api/system/shutdown');
    } catch (err) {
      alert('Error al intentar apagar');
    }
  }
};

// Helpers for Synology-style widget
const formatUptime = (seconds: number) => {
  if (!seconds) return '0 día(s) 00:00:00';
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d} día(s) ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatGB = (bytes: number) => {
  if (!bytes) return '0 GB';
  return (bytes / (1024 ** 3)).toFixed(1) + ' GB';
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
          <Terminal v-else-if="win.id === 'terminal'" :size="16" />
          <Settings v-else :size="16" />
          <span class="taskbar-label">{{ win.title }}</span>
        </button>
      </div>
      
      <div class="top-right">
        <button class="icon-btn"><Search :size="18"/></button>
        <button class="icon-btn"><Bell :size="18"/></button>
        <div class="time">{{ new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</div>
        
        <div class="user-pill-container">
          <div class="user-pill glass" :class="{ active: showUserMenu }" @click="toggleUserMenu">
            <User :size="16"/>
            <span>{{ auth.user?.username }}</span>
          </div>

          <div v-if="showUserMenu" class="user-dropdown fade-in">
            <div class="dropdown-header">
              <div class="user-avatar-large"><User :size="24"/></div>
              <div class="user-info-large">
                <div class="username-large">{{ auth.user?.username }}</div>
                <div class="user-role-large">{{ auth.user?.role }}</div>
              </div>
            </div>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click="handleLogout"><LogOut :size="16" /> <span>Cerrar sesión</span></button>
            <button class="dropdown-item" @click="handleReboot"><RotateCcw :size="16" /> <span>Reiniciar</span></button>
            <button class="dropdown-item power" @click="handleShutdown"><Power :size="16" /> <span>Apagar</span></button>
          </div>
          <div v-if="showUserMenu" class="menu-overlay" @click="closeUserMenu"></div>
        </div>
      </div>
    </header>

    <main class="desktop-area">
      <!-- Watermark removed as requested -->

      <DesktopIcon v-for="icon in desktop.desktopIcons" :key="icon.id" :iconData="icon" />
      <DesktopIcon v-for="icon in desktop.dynamicIcons" :key="icon.id" :iconData="icon" />

      <!-- Windows -->
      <Window appId="files" title="Explorador de Archivos"><Files /></Window>
      <Window appId="apps" title="Centro de Aplicaciones"><Apps /></Window>
      <Window appId="monitor" title="Monitor del Sistema"><Home /></Window>
      <Window appId="admin" title="Panel de Control"><ControlPanel /></Window>
      <Window appId="terminal" title="Terminal" :noPadding="true"><TerminalView /></Window>
      
      <!-- Synology-style System Status Widget -->
      <aside class="resource-widget glass syno-style">
        <div class="syno-section health">
          <div class="section-title"><CheckCircle2 :size="14" class="title-icon"/> Salud del sistema</div>
          <div class="health-content">
            <div class="status-icon-box"><CheckCircle2 :size="48" color="#22c55e" fill="#22c55e22" /></div>
            <div class="status-text">
              <div class="status-main">En buen estado</div>
              <div class="status-sub">Su NubeOS funciona bien.</div>
            </div>
          </div>
          <div class="syno-info-list">
            <div class="info-row"><span class="label">Nombre</span> <span class="val">{{ stats.hostname || 'NubeOS' }}</span></div>
            <div class="info-row"><span class="label">IP Local</span> <span class="val">{{ stats.ip }}</span></div>
            <div class="info-row"><span class="label">Uptime</span> <span class="val">{{ formatUptime(stats.details?.uptime || 0) }}</span></div>
          </div>
        </div>

        <div class="syno-section resources">
          <div class="section-title"><Activity :size="14" class="title-icon"/> Monitor de recursos</div>
          <div class="res-item">
            <span class="label">CPU</span>
            <div class="bar-bg"><div class="bar" :style="{ width: stats.cpu + '%' }"></div></div>
            <span class="pct">{{ stats.cpu }}%</span>
          </div>
          <div class="res-item">
            <span class="label">RAM</span>
            <div class="bar-bg"><div class="bar" :style="{ width: stats.ram + '%' }"></div></div>
            <span class="pct">{{ stats.ram }}%</span>
          </div>
        </div>

        <div class="syno-section storage">
          <div class="section-title"><Database :size="14" class="title-icon"/> Almacenamiento</div>
          <div class="storage-item">
            <div class="storage-icon"><div class="drive-circle"><Database :size="18" /></div></div>
            <div class="storage-info">
              <div class="storage-label">Volumen 1 (Saludable)</div>
              <div class="bar-bg"><div class="bar" :style="{ width: stats.disk + '%' }"></div></div>
              <div class="storage-data">
                {{ formatGB(stats.details?.diskUsed || 0) }} | {{ formatGB((stats.details?.diskTotal || 0) - (stats.details?.diskUsed || 0)) }} libre
              </div>
            </div>
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>

<style scoped>
.desktop-container {
  width: 100vw;
  height: 100vh;
  background-size: cover;
  background-position: center;
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
  z-index: 1000;
}

.taskbar {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}

.taskbar-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 0.78rem;
  transition: all 0.2s;
}

.taskbar-item.active {
  background: rgba(99, 102, 241, 0.15);
  color: white;
}

.desktop-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  padding: 1rem;
}

/* Widgets */
.resource-widget {
  position: absolute;
  top: 2rem;
  right: 2rem;
  width: 280px;
  background: #1e293b !important;
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  z-index: 10;
  display: flex;
  flex-direction: column;
}

.syno-section {
  padding: 1.25rem;
  border-bottom: 2px solid rgba(0,0,0,0.2);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
}

.health-content { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.status-main { font-size: 1.1rem; font-weight: 700; color: #22c55e; }
.status-sub { font-size: 0.7rem; color: #94a3b8; }

.syno-info-list { display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.75rem; }
.info-row { display: flex; justify-content: space-between; }
.info-row .label { color: #94a3b8; }

.res-item { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; font-size: 0.75rem; }
.res-item .label { width: 30px; font-weight: 700; }
.bar-bg { flex: 1; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
.bar { height: 100%; background: #3b82f6; transition: width 0.5s; }
.pct { width: 30px; text-align: right; }

.storage-item { display: flex; gap: 0.75rem; }
.drive-circle { width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; color: #3b82f6; }
.storage-label { font-size: 0.75rem; font-weight: 700; margin-bottom: 3px; }
.storage-data { font-size: 0.65rem; color: #3b82f6; margin-top: 3px; }

/* Menus */
.user-dropdown {
  position: absolute;
  top: 130%;
  right: 0;
  width: 240px;
  background: #1e293b;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  padding: 10px;
  z-index: 1001;
}
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  color: white;
  width: 100%;
  text-align: left;
}
.dropdown-item:hover { background: rgba(255,255,255,0.1); }
</style>
