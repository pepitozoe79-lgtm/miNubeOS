<script setup lang="ts">
import { onMounted, ref } from 'vue';
import axios from 'axios';
import { 
  Play, 
  Square, 
  Download, 
  ExternalLink, 
  LayoutGrid, 
  ShoppingBag,
  RefreshCw
} from 'lucide-vue-next';

interface AppContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
}

interface StoreApp {
  id: string;
  name: string;
  description: string;
  image: string;
  icon: string;
}

const activeTab = ref<'installed' | 'store'>('installed');
const installedApps = ref<AppContainer[]>([]);
const storeApps = ref<StoreApp[]>([]);
const loading = ref(false);

const fetchData = async () => {
  loading.value = true;
  try {
    const [inst, store] = await Promise.all([
      axios.get('/api/apps/installed'),
      axios.get('/api/apps/store')
    ]);
    installedApps.value = inst.data;
    storeApps.value = store.data;
  } catch (err) {
    console.error('Error fetching apps:', err);
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

// Error handle fix again
</script>

<template>
  <div class="apps-view fade-in">
    <header class="view-header">
      <div class="title-group">
        <h1>Centro de Aplicaciones</h1>
        <p>Gestiona tus servicios y herramientas.</p>
      </div>

      <div class="tab-group glass">
        <button 
          @click="activeTab = 'installed'" 
          :class="{ active: activeTab === 'installed' }"
        >
          <LayoutGrid :size="18"/> <span>Instaladas</span>
        </button>
        <button 
          @click="activeTab = 'store'" 
          :class="{ active: activeTab === 'store' }"
        >
          <ShoppingBag :size="18"/> <span>Tienda</span>
        </button>
      </div>

      <button @click="fetchData" class="refresh-btn" :class="{ spinning: loading }">
        <RefreshCw :size="20"/>
      </button>
    </header>

    <div v-if="activeTab === 'installed'" class="apps-grid">
      <div v-for="app in installedApps" :key="app.id" class="app-card glass">
        <div class="app-header">
          <div class="app-icon default">🐳</div>
          <div class="app-info">
            <h3>{{ app.name }}</h3>
            <span class="image-tag">{{ app.image }}</span>
          </div>
          <div class="status-badge" :class="app.status">
            {{ app.status }}
          </div>
        </div>
        
        <div class="app-meta">
          <span>{{ app.state }}</span>
        </div>

        <div class="app-actions">
          <button 
            v-if="app.status !== 'running'" 
            @click="startApp(app.id)"
            class="action-btn start"
          >
            <Play :size="16"/> <span>Iniciar</span>
          </button>
          <button 
            v-else 
            @click="stopApp(app.id)"
            class="action-btn stop"
          >
            <Square :size="16"/> <span>Detener</span>
          </button>
          
          <button class="action-btn open">
            <ExternalLink :size="16"/> <span>Abrir</span>
          </button>
        </div>
      </div>

      <div v-if="installedApps.length === 0" class="empty-state">
        <p>No tienes apps instaladas.</p>
      </div>
    </div>

    <div v-else class="store-grid">
      <div v-for="app in storeApps" :key="app.id" class="store-card glass">
        <div class="store-icon">{{ app.icon }}</div>
        <div class="store-info">
          <h3>{{ app.name }}</h3>
          <p>{{ app.description }}</p>
        </div>
        <button class="install-btn">
          <Download :size="18"/> <span>Instalar</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.apps-view {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-group h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
.title-group p { color: var(--text-muted); font-size: 0.9rem; }

.tab-group {
  display: flex;
  padding: 4px;
  gap: 4px;
}

.tab-group button {
  padding: 0.6rem 1.25rem;
  background: transparent;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tab-group button.active {
  background: var(--primary);
  color: white;
}

.refresh-btn {
  background: rgba(255, 255, 255, 0.05);
  padding: 0.75rem;
  color: var(--text-muted);
}

.refresh-btn.spinning { animation: spin 1s linear infinite; }

.apps-grid, .store-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

/* App Card */
.app-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.app-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.app-icon.default {
  width: 48px;
  height: 48px;
  background: #1e293b;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.app-info { flex: 1; }
.app-info h3 { font-size: 1.1rem; margin-bottom: 0.25rem; }
.image-tag { font-size: 0.75rem; color: var(--text-muted); font-family: monospace; }

.status-badge {
  font-size: 0.7rem;
  text-transform: uppercase;
  font-weight: 800;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.status-badge.running { background: rgba(34, 197, 94, 0.1); color: #4ade80; }
.status-badge.exited { background: rgba(239, 68, 68, 0.1); color: #f87171; }

.app-meta { font-size: 0.85rem; color: var(--text-muted); }

.app-actions {
  display: flex;
  gap: 0.75rem;
  border-top: 1px solid var(--border);
  padding-top: 1.25rem;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  padding: 0.6rem;
}

.action-btn.start { background: rgba(34, 197, 94, 0.1); color: #4ade80; }
.action-btn.stop { background: rgba(239, 68, 68, 0.1); color: #f87171; }
.action-btn.open { background: rgba(255, 255, 255, 0.05); color: white; }

/* Store Card */
.store-card {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.store-icon {
  font-size: 2.5rem;
}

.store-info { flex: 1; }
.store-info h3 { font-size: 1.1rem; margin-bottom: 0.25rem; }
.store-info p { font-size: 0.85rem; color: var(--text-muted); }

.install-btn {
  background: var(--primary);
  color: white;
  padding: 0.6rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
