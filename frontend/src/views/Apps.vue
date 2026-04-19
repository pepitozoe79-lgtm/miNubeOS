<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import axios from 'axios';
import { 
  Search,
  RefreshCw,
  Folder,
  Shield,
  Wrench,
  Film,
  Briefcase,
  Database,
  Code,
  Layers,
  Star
} from 'lucide-vue-next';

interface StoreApp {
  id: string;
  name: string;
  description: string;
  image: string;
  icon: string;
  category: string;
  developer: string;
  ports: Record<string, number>;
  webPort?: number;
  webPath?: string;
  container?: any;
}

const allApps = ref<StoreApp[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const activeCategory = ref('all');
const installingApp = ref<string | null>(null);
const installProgress = ref(0);
const installStatusLabel = ref('');

const categories = [
  { id: 'all', name: 'Todos', icon: Layers },
  { id: 'cloud', name: 'Nube', icon: Folder },
  { id: 'media', name: 'Multimedia', icon: Film },
  { id: 'productivity', name: 'Productividad', icon: Briefcase },
  { id: 'security', name: 'Seguridad', icon: Shield },
  { id: 'database', name: 'Base de Datos', icon: Database },
  { id: 'utilities', name: 'Utilidades', icon: Wrench },
  { id: 'development', name: 'Desarrollo', icon: Code },
];

const filteredApps = computed(() => {
  let apps = allApps.value;
  
  if (activeCategory.value !== 'all') {
    apps = apps.filter(a => a.category === activeCategory.value);
  }
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    apps = apps.filter(a => 
      a.name.toLowerCase().includes(q) || 
      a.description.toLowerCase().includes(q) ||
      a.developer.toLowerCase().includes(q)
    );
  }
  
  return apps;
});

const installedApps = computed(() => filteredApps.value.filter(a => a.container));
const availableApps = computed(() => filteredApps.value.filter(a => !a.container));

const fetchData = async () => {
  loading.value = true;
  try {
    const [instRes, storeRes] = await Promise.all([
      axios.get('/api/apps/installed').catch(() => ({ data: [] })),
      axios.get('/api/apps/store').catch(() => ({ data: [] }))
    ]);

    const installed = instRes.data;
    const store = storeRes.data;

    allApps.value = store.map((sApp: any) => {
      const isInstalled = installed.find((iApp: any) => 
        iApp.name === `nubeos-${sApp.id}` || iApp.name === sApp.id
      );
      return {
        ...sApp,
        category: sApp.category || 'utilities',
        developer: sApp.developer || 'Comunidad',
        container: isInstalled || null
      };
    });
  } catch (err) {
    console.error('Error fetching data:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);

const startApp = async (id: string) => {
  try {
    await axios.post(`/api/apps/${id}/start`);
    fetchData();
  } catch (err) {
    alert('Error al iniciar app');
  }
};

const stopApp = async (id: string) => {
  try {
    await axios.post(`/api/apps/${id}/stop`);
    fetchData();
  } catch (err) {
    alert('Error al detener app');
  }
};

const installApp = async (id: string) => {
  if (installingApp.value) return;
  installingApp.value = id;
  installProgress.value = 0;
  installStatusLabel.value = 'Descargando...';
  
  // Simulate progress
  const interval = setInterval(() => {
    if (installProgress.value < 80) {
      installProgress.value += Math.random() * 12;
    } else if (installProgress.value < 99) {
      installStatusLabel.value = 'Instalando...';
      installProgress.value = Math.min(installProgress.value + 0.8, 99);
    }
  }, 800);

  try {
    await axios.post(`/api/apps/install/${id}`);
    installProgress.value = 100;
    installStatusLabel.value = '¡Listo!';
    setTimeout(() => {
      fetchData();
      installingApp.value = null;
      installProgress.value = 0;
      installStatusLabel.value = '';
    }, 1000);
  } catch (err: any) {
    alert(err.response?.data?.error || 'Error al instalar app');
    installingApp.value = null;
    installProgress.value = 0;
    installStatusLabel.value = '';
  } finally {
    clearInterval(interval);
  }
};

const getStatusText = (app: StoreApp) => {
  if (!app.container) return '';
  return app.container.status === 'running' ? 'Ejecutando' : 'Detenida';
};

const openAppUrl = (app: StoreApp) => {
  if (!app.webPort) return;
  const host = window.location.hostname;
  const path = app.webPath || '';
  window.open(`http://${host}:${app.webPort}${path}`, '_blank');
};
</script>

<template>
  <div class="pkg-center">
    <!-- Sidebar -->
    <aside class="pkg-sidebar">
      <div class="sidebar-search">
        <Search :size="14" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar apps..." 
        />
      </div>

      <nav class="sidebar-nav">
        <div class="nav-label">Categorías</div>
        <button 
          v-for="cat in categories" 
          :key="cat.id"
          class="nav-item"
          :class="{ active: activeCategory === cat.id }"
          @click="activeCategory = cat.id"
        >
          <component :is="cat.icon" :size="16" />
          <span>{{ cat.name }}</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <Star :size="14" />
        <span>NubeOS App Store</span>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="pkg-main">
      <!-- Top Actions Bar -->
      <div class="pkg-toolbar">
        <div class="toolbar-left">
          <h2>{{ categories.find(c => c.id === activeCategory)?.name || 'Todos' }}</h2>
          <span class="app-count">{{ filteredApps.length }} apps</span>
        </div>
        <div class="toolbar-right">
          <button @click="fetchData" class="toolbar-btn" :class="{ spinning: loading }" title="Actualizar">
            <RefreshCw :size="16" />
          </button>
        </div>
      </div>

      <!-- Installed Section -->
      <section v-if="installedApps.length > 0" class="pkg-section">
        <div class="section-header">
          <h3>Instaladas</h3>
          <div class="section-line"></div>
        </div>
        <div class="apps-grid">
          <div 
            v-for="app in installedApps" 
            :key="app.id" 
            class="app-tile"
          >
            <div class="tile-icon"><img :src="app.icon" :alt="app.name" /></div>
            <div class="tile-info">
              <div class="tile-name">{{ app.name }}</div>
              <div class="tile-dev">{{ app.developer }}</div>
            </div>
            <div class="tile-actions">
              <span 
                class="tile-status" 
                :class="{ running: app.container?.status === 'running' }"
              >
                {{ getStatusText(app) }}
              </span>
              <button 
                v-if="app.container?.status === 'running'" 
                @click="stopApp(app.container.id)" 
                class="tile-btn stop"
              >
                Detener
              </button>
              <button 
                v-else 
                @click="startApp(app.container.id)" 
                class="tile-btn start"
              >
                Iniciar
              </button>
              <button 
                v-if="app.container?.status === 'running' && app.webPort" 
                @click="openAppUrl(app)"
                class="tile-btn open"
              >
                Abrir
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Available Section -->
      <section v-if="availableApps.length > 0" class="pkg-section">
        <div class="section-header">
          <h3>Disponibles</h3>
          <div class="section-line"></div>
        </div>
        <div class="apps-grid">
          <div 
            v-for="app in availableApps" 
            :key="app.id" 
            class="app-tile available"
          >
            <div class="tile-icon"><img :src="app.icon" :alt="app.name" /></div>
            <div class="tile-info">
              <div class="tile-name">{{ app.name }}</div>
              <div class="tile-dev">{{ app.developer }}</div>
            </div>
            <div class="tile-actions">
              <button 
                v-if="installingApp === app.id"
                class="tile-btn installing"
                disabled
              >
                <div class="install-progress">
                  <div class="install-bar" :style="{ width: installProgress + '%' }"></div>
                  <div class="install-label">{{ installStatusLabel }}</div>
                </div>
                <span>{{ Math.round(installProgress) }}%</span>
              </button>
              <button 
                v-else
                @click="installApp(app.id)" 
                class="tile-btn install"
              >
                Instalar
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Empty State -->
      <div v-if="filteredApps.length === 0 && !loading" class="empty-state">
        <Search :size="48" />
        <p>No se encontraron aplicaciones</p>
        <span>Prueba con otra categoría o término de búsqueda</span>
      </div>
    </main>
  </div>
</template>

<style scoped>
.pkg-center {
  display: flex;
  height: 100%;
  margin: -1.5rem;
  overflow: hidden;
}

/* ── Sidebar ── */
.pkg-sidebar {
  width: 200px;
  min-width: 200px;
  background: rgba(0, 0, 0, 0.2);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 0.75rem 0;
}

.sidebar-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0.75rem 0.75rem;
  padding: 0.5rem 0.65rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-muted);
}

.sidebar-search input {
  flex: 1;
  background: transparent;
  border: none;
  color: white;
  font-size: 0.8rem;
  outline: none;
}

.sidebar-search input::placeholder {
  color: var(--text-muted);
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
}

.nav-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  padding: 0.75rem 1rem 0.4rem;
  font-weight: 700;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.55rem 1rem;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
  text-align: left;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.nav-item.active {
  background: var(--primary);
  color: white;
  font-weight: 600;
}

.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.7rem;
  color: var(--text-muted);
  border-top: 1px solid var(--border);
}

/* ── Main Area ── */
.pkg-main {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.pkg-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-left {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.toolbar-left h2 {
  font-size: 1.3rem;
  font-weight: 800;
}

.app-count {
  font-size: 0.8rem;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.05);
  padding: 0.15rem 0.6rem;
  border-radius: 10px;
}

.toolbar-right {
  display: flex;
  gap: 0.5rem;
}

.toolbar-btn {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.toolbar-btn.spinning svg {
  animation: spin 1s linear infinite;
}

/* ── Section ── */
.pkg-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.section-header h3 {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.section-line {
  flex: 1;
  height: 1px;
  background: var(--border);
}

/* ── App Grid ── */
.apps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.6rem;
}

/* ── App Tile (like Synology) ── */
.app-tile {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.7rem 0.85rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.app-tile:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
}

.app-tile.available {
  opacity: 0.85;
}

.app-tile.available:hover {
  opacity: 1;
}

.tile-icon {
  width: 44px;
  height: 44px;
  min-width: 44px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.tile-icon img {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.tile-info {
  flex: 1;
  min-width: 0;
}

.tile-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tile-dev {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 0.1rem;
}

.tile-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.tile-status {
  font-size: 0.65rem;
  color: var(--text-muted);
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
}

.tile-status.running {
  color: #4ade80;
  background: rgba(34, 197, 94, 0.1);
}

/* ── Tile Buttons ── */
.tile-btn {
  font-size: 0.75rem;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.tile-btn.install {
  background: var(--primary);
  color: white;
  border: none;
}

.tile-btn.install:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.tile-btn.start {
  background: rgba(34, 197, 94, 0.1);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.tile-btn.start:hover {
  background: rgba(34, 197, 94, 0.2);
}

.tile-btn.stop {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.15);
}

.tile-btn.stop:hover {
  background: rgba(239, 68, 68, 0.2);
}

.tile-btn.open {
  background: rgba(255, 255, 255, 0.05);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.tile-btn.open:hover {
  background: rgba(255, 255, 255, 0.1);
}

.tile-btn.installing {
  background: rgba(99, 102, 241, 0.1);
  color: var(--primary);
  border: 1px solid rgba(99, 102, 241, 0.2);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 90px;
  position: relative;
  overflow: hidden;
}

.install-progress {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.install-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: rgba(59, 130, 246, 0.4);
  transition: width 0.4s ease;
}

.install-label {
  position: relative;
  font-size: 0.65rem;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.tile-btn.installing span {
  position: relative;
  z-index: 1;
}

/* ── Empty State ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 4rem 2rem;
  color: var(--text-muted);
  text-align: center;
}

.empty-state p {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
}

.empty-state span {
  font-size: 0.85rem;
}

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
