<template>
  <div class="desktop-container" :style="{ backgroundImage: `url(${desktop.wallpaper})` }">
    <!-- Main Header / Top Bar -->
    <header class="top-bar">
      <div class="top-left">
        <div class="logo-container">
          <img src="/logo.png" alt="NubeOS" class="top-logo" @click="desktop.toggleWindow('apps')" />
          <span class="os-name">NubeOS</span>
        </div>
        <div v-if="state.currentVersion" class="dashboard-loading">UI Version: {{ state.currentVersion }}</div>
      </div>

      <nav class="taskbar">
        <div 
          v-for="win in openWindows" 
          :key="win.id"
          class="taskbar-item"
          :class="{ active: win.zIndex === desktop.topZIndex && !win.isMinimized }"
          @click="handleTaskbarClick(win.id)"
        >
          <component :is="getIconComponent(win.id)" :size="16" />
          <span>{{ win.title }}</span>
        </div>
      </nav>

      <div class="top-right">
        <div class="user-pill-container">
          <div class="user-pill" @click="toggleUserMenu">
            <span class="user-avatar"><User :size="16" /></span>
            <span class="user-name">{{ auth.user?.username || 'Admin' }}</span>
          </div>
          
          <Transition name="fade">
            <div v-if="state.showUserMenu" class="user-dropdown">
              <button class="dropdown-item" @click="desktop.openWindow('admin')">
                <Settings :size="16" /> Configuración
              </button>
              <button class="dropdown-item" @click="handleReboot">
                <RotateCcw :size="16" /> Reiniciar
              </button>
              <button class="dropdown-item" @click="handleShutdown">
                <Power :size="16" /> Apagar
              </button>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item logout" @click="handleLogout">
                <LogOut :size="16" /> Cerrar Sesión
              </button>
            </div>
          </Transition>
        </div>
        <div class="time">{{ new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</div>
      </div>
    </header>

    <main class="desktop-area" @contextmenu.prevent="handleContextMenu">
      <!-- Desktop Icons -->
      <div class="icons-container">
        <DesktopIcon 
          v-for="icon in desktop.desktopIcons" 
          :key="icon.id" 
          :icon-data="icon" 
        />
        <DesktopIcon 
          v-for="icon in desktop.dynamicIcons" 
          :key="icon.id" 
          :icon-data="icon" 
        />
      </div>

      <!-- Windows Layer -->
      <Window appId="files" title="Archivos"><Files /></Window>
      <Window appId="apps" title="Aplicaciones"><Apps /></Window>
      <Window appId="monitor" title="Monitor" @onReload="fetchStats"><Home /></Window>
      <Window appId="admin" title="Configuración" v-if="auth.isAdmin"><ControlPanel /></Window>
      <Window appId="terminal" title="Terminal" :noPadding="true"><TerminalView /></Window>
      
      <!-- System Status Widget -->
      <Transition name="fade">
        <aside class="syno-widget" v-if="state.showStatus">
          <div v-if="state.dashboardError" class="error-message">{{ state.dashboardError }}</div>
          
          <div class="syno-section health">
            <div class="section-title"><CheckCircle2 :size="14" /> SALUD DEL SISTEMA</div>
            <div class="health-content">
              <CheckCircle2 :size="40" color="#22c55e" />
              <div class="status-box">
                <div class="status-main">En buen estado</div>
                <div class="status-sub">Su NubeOS funciona bien.</div>
              </div>
            </div>
            <div class="syno-info-list" v-if="state.stats.ip">
              <div class="info-row"><span class="label">Dispositivo</span> <span class="val">{{ state.stats.hostname || 'NubeOS' }}</span></div>
              <div class="info-row"><span class="label">IP Local</span> <span class="val">{{ state.stats.ip }}</span></div>
              <div class="info-row" v-if="state.stats.details?.uptime"><span class="label">Uptime</span> <span class="val">{{ formatUptime(state.stats.details.uptime) }}</span></div>
            </div>
          </div>

          <div class="syno-section resources">
            <div class="section-title"><Activity :size="14" /> MONITOR DE RECURSOS</div>
            <div class="res-item">
              <div class="res-info">
                <span class="label">CPU</span>
                <span class="value">{{ state.stats.cpu || 0 }}%</span>
              </div>
              <div class="bar-bg"><div class="bar" :style="{ width: (state.stats.cpu || 0) + '%' }"></div></div>
            </div>
            <div class="res-item">
              <div class="res-info">
                <span class="label">RAM</span>
                <span class="value">{{ state.stats.ram || 0 }}%</span>
              </div>
              <div class="bar-bg"><div class="bar blue" :style="{ width: (state.stats.ram || 0) + '%' }"></div></div>
            </div>
          </div>

          <div class="syno-section storage">
            <div class="section-title"><Database :size="14" /> ALMACENAMIENTO</div>
            <div class="storage-item">
              <Database :size="24" color="#3b82f6" />
              <div class="storage-info">
                <div class="storage-label">Volumen 1</div>
                <div class="bar-bg"><div class="bar cyan" :style="{ width: (state.stats.disk || 0) + '%' }"></div></div>
                <div class="storage-data">{{ formatGB(state.stats.details?.diskUsed || 0) }} / {{ formatGB(state.stats.details?.diskTotal || 0) }}</div>
              </div>
            </div>
          </div>
        </aside>
      </Transition>

      <NotificationCenter />

      <!-- Desktop Context Menu -->
      <Transition name="fade">
        <div 
          v-if="state.desktopMenu.show" 
          class="desktop-context-menu glass"
          :style="{ left: state.desktopMenu.x + 'px', top: state.desktopMenu.y + 'px' }"
          @click.stop
        >
          <div class="menu-item" @click="handleRefresh">
            <RefreshCw :size="14" /> Actualizar
          </div>
          <div class="menu-divider"></div>
          <div class="menu-item" @click="desktop.openWindow('terminal')">
            <Terminal :size="14" /> Abrir Terminal
          </div>
          <div class="menu-item" @click="desktop.openWindow('files')">
            <Folder :size="14" /> Abrir Archivos
          </div>
          <div class="menu-divider"></div>
          <div class="menu-item" @click="desktop.openWindow('monitor')">
            <Monitor :size="14" /> Monitor de Sistema
          </div>
          <div class="menu-item" @click="desktop.openWindow('admin')">
            <Settings :size="14" /> Personalizar
          </div>
        </div>
      </Transition>
    </main>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, onUnmounted, computed, provide } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useDesktopStore, type WindowApp } from '../stores/desktop';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { 
  Folder, 
  Activity, 
  Settings, 
  LogOut, 
  RotateCcw, 
  Power, 
  CheckCircle2,
  Database,
  User,
  LayoutDashboard,
  Terminal,
  Search,
  Monitor,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-vue-next';
import Window from '../components/Window.vue';
import DesktopIcon from '../components/DesktopIcon.vue';
import NotificationCenter from '../components/NotificationCenter.vue';
import Files from './Files.vue';
import Apps from './Apps.vue';
import Home from './Home.vue';
import ControlPanel from './ControlPanel.vue';
import TerminalView from './Terminal.vue';
import { useNotificationStore } from '../stores/notification';

// State
const state = reactive({
  showUserMenu: false,
  showStatus: true,
  currentVersion: null as string | null,
  dashboardError: null as string | null,
  stats: { cpu: 0, ram: 0, disk: 0, hostname: '', ip: '', details: {} as any },
  showPopup: false,
  desktopMenu: { show: false, x: 0, y: 0 }
});

const auth = useAuthStore();
const desktop = useDesktopStore();
const notification = useNotificationStore();
const router = useRouter();

// Computed
const openWindows = computed(() => {
  return Object.values(desktop.windows).filter(w => w.isOpen);
});

// Methods
const toggleUserMenu = () => { 
  state.desktopMenu.show = false;
  state.showUserMenu = !state.showUserMenu; 
};

const handleContextMenu = (e: MouseEvent) => {
  state.showUserMenu = false;
  state.desktopMenu.show = true;
  state.desktopMenu.x = e.clientX;
  state.desktopMenu.y = e.clientY;
};

const closeMenus = () => {
  state.showUserMenu = false;
  state.desktopMenu.show = false;
};

const handleRefresh = () => {
  closeMenus();
  notification.success('Actualizando', 'Sincronizando el escritorio...');
  fetchStats();
  fetchDrives();
};

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

const iconMap: Record<string, any> = {
  files: Folder,
  apps: LayoutDashboard,
  monitor: Activity,
  admin: Settings,
  terminal: Terminal,
};

const getIconComponent = (appId: string) => {
  return iconMap[appId] || Search;
};

const fetchStats = async () => {
  try {
    const res = await axios.get('/api/system/stats');
    const data = res.data;
    if (state.currentVersion && data.version !== state.currentVersion) {
      window.location.reload();
      return;
    }
    if (!state.currentVersion) {
      state.currentVersion = data.version;
      notification.success('Sistema Conectado', `Bienvenido a ${data.hostname}`);
    }
    state.stats = data;
    state.dashboardError = null;
  } catch (err: any) {
    console.error('Error fetching stats:', err);
    state.dashboardError = 'Error conectando al sistema';
    notification.error('Error de Comunicación', 'No se pudieron sincronizar las estadísticas del sistema.');
  }
};

const handleLogout = () => { auth.logout(); router.push('/login'); };

const handleReboot = async () => {
  if (confirm('¿Reiniciar sistema?')) {
    try { await axios.post('/api/system/reboot'); } catch (err) { alert('Error al intentar reiniciar'); }
  }
};

const handleShutdown = async () => {
  if (confirm('¿Apagar sistema?')) {
    try { await axios.post('/api/system/shutdown'); } catch (err) { alert('Error al intentar apagar'); }
  }
};

const formatUptime = (seconds: number) => {
  if (!seconds) return '0 d 00:00:00';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const formatGB = (bytes: number) => {
  if (bytes === undefined || bytes === null) return '0 GB';
  return (bytes / (1024 ** 3)).toFixed(1) + ' GB';
};

const fetchDrives = async () => {
  try {
    const res = await axios.get('/api/system/external-drives');
    const drives = res.data;
    
    // Convert drives to desktop icons
    const icons = drives.map((drive: any, index: number) => ({
      id: drive.id ? `drive-${drive.id}` : `drive-${index}`,
      label: drive.label || `Unidad (${drive.path})`,
      icon: 'HardDrive',
      color: 'orange',
      x: 240, 
      y: 20 + (index * 120),
      type: 'drive',
      path: drive.path
    }));

    // Simple diff to notify new drives
    const currentDriveIds = Object.keys(desktop.dynamicIcons);
    icons.forEach((icon: any) => {
      if (!currentDriveIds.includes(icon.id)) {
        notification.success('Nuevo Dispositivo', `Se ha montado ${icon.label}`);
      }
    });

    desktop.setDynamicIcons(icons);
  } catch (err) {
    console.error('Error fetching external drives:', err);
  }
};

// Lifecycle
let statsTimer: any;
let drivesTimer: any;
onMounted(() => {
  auth.init();
  fetchStats();
  fetchDrives();
  statsTimer = setInterval(fetchStats, 5000);
  drivesTimer = setInterval(fetchDrives, 10000);
  window.addEventListener('click', closeMenus);
});
onUnmounted(() => { 
  clearInterval(statsTimer); 
  clearInterval(drivesTimer);
  window.removeEventListener('click', closeMenus);
});
</script>

<style scoped>
.desktop-container {
  width: 100vw; height: 100vh;
  display: flex; flex-direction: column;
  overflow: hidden; position: relative;
  background-color: #0f172a;
  background-size: cover;
  background-position: center;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.top-bar {
  height: 48px; min-height: 48px;
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 1rem; z-index: 2500; 
  background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  box-shadow: 0 2px 10px rgba(0,0,0,0.4);
}

.top-left, .top-right { display: flex; align-items: center; gap: 1rem; }
.logo-container { display: flex; align-items: center; gap: 0.75rem; cursor: pointer; }
.top-logo { height: 24px; width: 24px; object-fit: contain; }
.os-name { font-weight: 700; font-size: 1rem; color: white; }

.taskbar { flex: 1; display: flex; justify-content: center; gap: 0.5rem; padding: 0 1rem; }
.taskbar-item {
  height: 34px; padding: 0 0.85rem;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  display: flex; align-items: center; gap: 0.6rem;
  font-size: 0.85rem; border-radius: 8px; color: #94a3b8;
  cursor: pointer; max-width: 160px; transition: all 0.2s;
}
.taskbar-item.active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.3));
  border-color: rgba(59, 130, 246, 0.4); color: white;
}

.user-pill-container { position: relative; }
.user-pill {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.35rem 0.8rem; border-radius: 20px;
  background: rgba(255,255,255,0.08); cursor: pointer; color: white;
}
.user-avatar { background: #3b82f6; border-radius: 50%; padding: 4px; display: flex;}
.user-dropdown {
  position: absolute; top: calc(100% + 12px); right: 0; width: 220px;
  background: #1e293b; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 20px 50px rgba(0,0,0,0.6); padding: 0.75rem;
}
.dropdown-item {
  width: 100%; padding: 0.75rem 1rem;
  color: #e2e8f0; font-size: 0.9rem; border-radius: 10px;
  display: flex; align-items: center; gap: 0.75rem;
  background: transparent; border: none; cursor: pointer;
}
.dropdown-item:hover { background: rgba(59, 130, 246, 0.1); }
.dropdown-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 0.5rem 0; }

.desktop-area { flex: 1; position: relative; }
.icons-container {
  position: absolute; inset: 0; padding: 1.5rem;
  display: grid; grid-template-rows: repeat(auto-fill, 100px);
  grid-auto-flow: column; gap: 1rem; pointer-events: none; z-index: 20;
}

.syno-widget {
  position: absolute; top: 1.5rem; right: 1.5rem; width: 280px;
  background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(20px);
  border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); z-index: 100; color: white;
}
.syno-section { padding: 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
.section-title { font-size: 0.7rem; font-weight: 800; color: #64748b; letter-spacing: 0.1em; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.6rem; }
.status-main { font-weight: 700; color: #10b981; font-size: 1.15rem; }
.bar-bg { height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; }
.bar { height: 100%; background: #3b82f6; transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
.bar.blue { background: #3b82f6; }
.bar.cyan { background: #06b6d4; }

.res-item { margin-bottom: 1rem; }
.res-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 0.8rem; }
.res-info .label { color: #94a3b8; font-weight: 500; }
.res-info .value { color: white; font-weight: 600; }

.syno-info-list { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.4rem; }
.info-row { display: flex; justify-content: space-between; font-size: 0.75rem; }
.info-row .label { color: #64748b; }
.info-row .val { color: #e2e8f0; font-weight: 500; }

.time { font-size: 0.9rem; font-weight: 600; color: white; margin-left: 1rem; }

.desktop-context-menu {
  position: fixed;
  width: 180px;
  padding: 6px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  z-index: 5000;
}

.menu-item {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  color: #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-item:hover {
  background: rgba(59, 130, 246, 0.2);
  color: white;
}

.menu-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.05);
  margin: 4px 0;
}

.fade-enter-active, .fade-leave-active { transition: all 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
