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

const allApps = ref<any[]>([]);

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

const installingApp = ref<string | null>(null);

const installApp = async (id: string) => {
  if (installingApp.value) return;
  installingApp.value = id;
  try {
    const res = await axios.post(`/api/apps/install/${id}`);
    alert(res.data.message);
    activeTab.value = 'installed';
    fetchData();
  } catch (err: any) {
    alert(err.response?.data?.error || 'Error al instalar app');
  } finally {
    installingApp.value = null;
  }
};

// Error handle fix again
</script>

<template>
  <div class="apps-view fade-in">
    <header class="view-header">
      <div class="title-group">
        <h1>Centro de Aplicaciones</h1>
        <p>Activa y gestiona los servicios integrados en tu NubeOS.</p>
      </div>

      <button @click="fetchData" class="refresh-btn" :class="{ spinning: loading }">
        <RefreshCw :size="20"/>
      </button>
    </header>

    <div class="apps-grid">
      <div v-for="app in allApps" :key="app.id" class="app-card glass" :class="{ inactive: !app.container }">
        <div class="app-header">
          <div class="app-icon">{{ app.icon }}</div>
          <div class="app-info">
            <div class="title-row">
              <h3>{{ app.name }}</h3>
              <div v-if="app.container" class="status-badge" :class="app.container.status">
                {{ app.container.status === 'running' ? 'Activa' : 'Detenida' }}
              </div>
              <div v-else class="status-badge inactive">Inactiva</div>
            </div>
            <p class="app-desc">{{ app.description }}</p>
          </div>
        </div>
        
        <div class="app-actions">
          <!-- Not Installed Action -->
          <button 
            v-if="!app.container" 
            @click="installApp(app.id)" 
            class="action-btn activate"
            :disabled="installingApp === app.id"
          >
            <template v-if="installingApp === app.id">
              <RefreshCw :size="16" class="spinning"/> <span>Activando...</span>
            </template>
            <template v-else>
              <Download :size="16"/> <span>Activar App</span>
            </template>
          </button>

          <!-- Installed Actions -->
          <template v-else>
            <button 
              v-if="app.container.status !== 'running'" 
              @click="startApp(app.container.id)"
              class="action-btn start"
            >
              <Play :size="16"/> <span>Reanudar</span>
            </button>
            <button 
              v-else 
              @click="stopApp(app.container.id)"
              class="action-btn stop"
            >
              <Square :size="16"/> <span>Desactivar</span>
            </button>
            
            <button class="action-btn open">
              <ExternalLink :size="16"/> <span>Abrir</span>
            </button>
          </template>
        </div>
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
  align-items: center;
  gap: 1.25rem;
}

.app-icon {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border: 1px solid rgba(255,255,255,0.1);
}

.app-info { flex: 1; }
.title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem; }
.app-info h3 { font-size: 1.1rem; font-weight: 700; color: white; }
.app-desc { font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; }

.status-badge {
  font-size: 0.65rem;
  text-transform: uppercase;
  font-weight: 800;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  letter-spacing: 0.05em;
}

.status-badge.running { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
.status-badge.exited { background: rgba(239, 68, 68, 0.15); color: #f87171; }
.status-badge.inactive { background: rgba(255, 255, 255, 0.05); color: #94a3b8; }

.app-card.inactive { opacity: 0.7; filter: grayscale(0.5); border: 1px dashed rgba(255,255,255,0.1); }
.app-card.inactive:hover { opacity: 1; filter: none; border: 1px solid var(--primary); }

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

.action-btn.activate { background: var(--primary); color: white; border: none; font-weight: 700; }
.action-btn.start { background: rgba(34, 197, 94, 0.1); color: #4ade80; }
.action-btn.stop { background: rgba(239, 68, 68, 0.1); color: #f87171; }
.action-btn.open { background: rgba(255, 255, 255, 0.05); color: white; border: 1px solid rgba(255,255,255,0.1); }

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
