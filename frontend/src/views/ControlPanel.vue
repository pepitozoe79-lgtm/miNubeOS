<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { useDesktopStore } from '../stores/desktop';
import { 
  User, 
  Users, 
  FolderHeart, 
  Network, 
  FolderSync, 
  AppWindow,
  Globe,
  FileJson,
  Terminal,
  Search,
  PlayCircle,
  Database,
  Layers,
  HardDrive,
  Cpu,
  Unplug,
  ShieldCheck,
  Disc,
  Languages,
  Zap,
  CalendarClock,
  Bell,
  Lock,
  Settings,
  Info,
  Activity,
  List,
  UserCheck,
  FileText,
  Palette,
  ArrowLeft,
  Image as ImageIcon,
  UserPlus,
  Trash2,
  Shield,
  Clock,
  RefreshCw
} from 'lucide-vue-next';

interface AppUser {
  id: number;
  username: string;
  role: string;
  created_at: string;
}

const desktop = useDesktopStore();
const searchQuery = ref('');
const activeSubView = ref('grid'); // 'grid' | 'personalization' | 'user'

// User Management State
const appUsers = ref<AppUser[]>([]);
const loadingUsers = ref(false);
const showCreateModal = ref(false);
const newUser = ref({ username: '', password: '', role: 'user' });

// Wallpaper State
const wallpapers = ref<{ name: string; url: string; type: string }[]>([]);
const isUploadingWallpaper = ref(false);
const wallpaperInput = ref<HTMLInputElement | null>(null);

const fetchWallpapers = async () => {
  try {
    const res = await axios.get('/api/system/wallpapers');
    wallpapers.value = res.data;
  } catch (err) {
    console.error('Error fetching wallpapers');
  }
};

const handleWallpaperUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) return;

  const file = target.files[0];
  const formData = new FormData();
  formData.append('wallpaper', file);

  isUploadingWallpaper.value = true;
  try {
    const res = await axios.post('/api/system/wallpaper', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (res.data.success) {
      await fetchWallpapers();
      desktop.setWallpaper(res.data.url);
    }
  } catch (err: any) {
    alert(err.response?.data?.error || 'Error al subir fondo de pantalla');
  } finally {
    isUploadingWallpaper.value = false;
  }
};

const deleteWallpaper = async (url: string) => {
  if (confirm('¿Deseas eliminar este fondo de pantalla personalizado?')) {
    try {
      await axios.delete('/api/system/wallpaper', { data: { url } });
      await fetchWallpapers();
      
      // Si el fondo que borramos era el actual, ponemos el por defecto
      if (desktop.wallpaper === url) {
        desktop.setWallpaper('/wallpapers/wp1.png');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar fondo');
    }
  }
};

onMounted(() => {
  fetchWallpapers();
});

const categories = [
  {
    title: 'Privilegios',
    items: [
      { id: 'user', name: 'Usuario', icon: User, color: '#4f46e5' },
      { id: 'user_group', name: 'Grupo de Usuarios', icon: Users, color: '#7c3aed' },
      { id: 'shared_folder', name: 'Carpeta Compartida', icon: FolderHeart, color: '#f59e0b' },
      { id: 'domain', name: 'Dominio/LDAP', icon: Network, color: '#64748b' },
      { id: 'remote_folder', name: 'Carpeta Remota', icon: FolderSync, color: '#10b981' },
      { id: 'app', name: 'Aplicación', icon: AppWindow, color: '#3b82f6' },
    ]
  },
  {
    title: 'Servicios de Red',
    items: [
      { id: 'network', name: 'Red', icon: Globe, color: '#0ea5e9' },
      { id: 'file_service', name: 'Servicio de Archivos', icon: FileJson, color: '#6366f1' },
      { id: 'terminal', name: 'Terminal y SNMP', icon: Terminal, color: '#334155' },
      { id: 'discovery', name: 'Servicio de Descubrimiento', icon: Search, color: '#94a3b8' },
      { id: 'media_index', name: 'Índice de Multimedia', icon: PlayCircle, color: '#ec4899' },
    ]
  },
  {
    title: 'Administrador de Almacenamiento',
    items: [
      { id: 'volume', name: 'Volumen', icon: Database, color: '#2563eb' },
      { id: 'storage_pool', name: 'Grupo de Almacenamiento', icon: Layers, color: '#0891b2' },
      { id: 'hdd', name: 'Disco Duro', icon: HardDrive, color: '#475569' },
      { id: 'vdisk', name: 'Disco Virtual', icon: Disc, color: '#64748b' },
      { id: 'ext_storage', name: 'Almacenamiento Externo', icon: Unplug, color: '#059669' },
      { id: 'hot_spare', name: 'Repuesto en Caliente', icon: ShieldCheck, color: '#dc2626' },
      { id: 'ssd_cache', name: 'Caché SSD', icon: Cpu, color: '#d97706' },
    ]
  },
  {
    title: 'Ajustes Generales',
    items: [
      { id: 'region', name: 'Región e Idioma', icon: Languages, color: '#10b981' },
      { id: 'power', name: 'Hardware y Energía', icon: Zap, color: '#facc15' },
      { id: 'tasks', name: 'Tareas Programadas', icon: CalendarClock, color: '#4f46e5' },
      { id: 'notifications', name: 'Notificaciones', icon: Bell, color: '#f97316' },
      { id: 'security', name: 'Seguridad', icon: Lock, color: '#ef4444' },
      { id: 'personalization', name: 'Personalización', icon: Palette, color: '#ec4899' },
      { id: 'system', name: 'Sistema', icon: Settings, color: '#3b82f6' },
      { id: 'update', name: 'Actualización', icon: RefreshCw, color: '#0ea5e9' },
    ]
  },
  {
    title: 'Información del Sistema',
    items: [
      { id: 'overview', name: 'Visión General', icon: Info, color: '#0ea5e9' },
      { id: 'res_monitor', name: 'Monitor de Recursos', icon: Activity, color: '#22c55e' },
      { id: 'services', name: 'Servicios', icon: Cpu, color: '#6366f1' },
      { id: 'processes', name: 'Procesos', icon: List, color: '#64748b' },
      { id: 'online_users', name: 'Usuarios en Línea', icon: UserCheck, color: '#3b82f6' },
      { id: 'port', name: 'Puerto', icon: Globe, color: '#94a3b8' },
      { id: 'log', name: 'Registro del Sistema', icon: FileText, color: '#475569' },
    ]
  }
];

// User Logic
const fetchUsers = async () => {
  loadingUsers.value = true;
  try {
    const res = await axios.get('/api/users');
    appUsers.value = res.data;
  } catch (err) {
    console.error('Error fetching users');
  } finally {
    loadingUsers.value = false;
  }
};

const createUser = async () => {
  try {
    await axios.post('/api/users', newUser.value);
    showCreateModal.value = false;
    newUser.value = { username: '', password: '', role: 'user' };
    fetchUsers();
  } catch (err: any) {
    alert(err.response?.data?.error || 'Error al crear usuario');
  }
};

const deleteUser = async (id: number) => {
  if (confirm('¿Estás seguro de eliminar este usuario?')) {
    try {
      await axios.delete(`/api/users/${id}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  }
};

const isUpdating = ref(false);
const showUpdateConfirm = ref(false);
const updateResult = ref<{ success: boolean; message: string; details?: string; path?: string } | null>(null);
const updateStatus = ref({ step: 'idle', progress: 0, message: '' });
let updatePollInterval: any = null;

const startStatusPolling = () => {
  if (updatePollInterval) clearInterval(updatePollInterval);
  
  updatePollInterval = setInterval(async () => {
    try {
      const res = await axios.get('/api/system/update/status');
      updateStatus.value = res.data;
      
      // Si termina con éxito o error, detenemos polling tras recibir el estado final
      if (res.data.step === 'idle' || res.data.step === 'error') {
        stopStatusPolling();
        if (res.data.step === 'idle') {
          updateResult.value = { success: true, message: '¡Sistema actualizado con éxito!' };
        } else {
          updateResult.value = { success: false, message: 'Error en la actualización', details: res.data.message };
        }
      }
    } catch (err) {
      // Si falla la conexión, es probable que se esté REINICIANDO
      if (updateStatus.value.step === 'restarting') {
        updateStatus.value.message = 'El sistema se está reiniciando. Reconectando...';
      }
    }
  }, 2000);
};

const stopStatusPolling = () => {
  if (updatePollInterval) {
    clearInterval(updatePollInterval);
    updatePollInterval = null;
  }
};

const performUpdate = async () => {
  showUpdateConfirm.value = false;
  isUpdating.value = true;
  updateResult.value = null;
  updateStatus.value = { step: 'starting', progress: 5, message: 'Iniciando proceso...' };
  
  try {
    await axios.post('/api/system/update');
    // Empezamos a preguntar por el estado real
    startStatusPolling();
  } catch (err: any) {
    isUpdating.value = false;
    updateResult.value = {
      success: false,
      message: err.response?.data?.error || 'Error al conectar con el servidor',
      details: err.response?.data?.details || 'No se pudo iniciar la actualización.'
    };
  }
};

onUnmounted(() => {
  stopStatusPolling();
});

const handleItemClick = (id: string) => {
  if (id === 'personalization') {
    activeSubView.value = 'personalization';
  } else if (id === 'user') {
    activeSubView.value = 'user';
    fetchUsers();
  } else if (id === 'update') {
    showUpdateConfirm.value = true;
  }
};
</script>

<template>
  <div class="control-panel-container fade-in">
    <!-- Main Grid View -->
    <template v-if="activeSubView === 'grid'">
      <header class="cp-header">
        <div class="header-left">
          <h2>Panel de Control</h2>
        </div>
        <div class="search-box glass">
          <Search :size="16" class="search-icon" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Buscar..."
          >
        </div>
      </header>

      <div class="cp-content">
        <section 
          v-for="cat in categories" 
          :key="cat.title" 
          class="cp-section"
        >
          <h3 class="section-title">{{ cat.title }}</h3>
          <div class="items-grid">
            <div 
              v-for="item in cat.items" 
              :key="item.id" 
              class="cp-item-wrapper"
              @click="handleItemClick(item.id)"
            >
              <div class="cp-item">
                <div class="icon-container" :style="{ color: item.color }">
                  <component :is="item.icon" :size="32" />
                </div>
                <span class="item-name">{{ item.name }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </template>

    <!-- User Management View -->
    <template v-else-if="activeSubView === 'user'">
      <header class="cp-header">
        <div class="header-left">
          <button class="back-btn" @click="activeSubView = 'grid'">
            <ArrowLeft :size="20" />
          </button>
          <h2>Gestión de Usuarios</h2>
        </div>
        <button @click="showCreateModal = true" class="btn-primary-sc">
          <UserPlus :size="18"/> <span>Nuevo Usuario</span>
        </button>
      </header>

      <div class="cp-content user-view">
        <div class="table-card glass">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in appUsers" :key="user.id">
                <td>{{ user.id }}</td>
                <td class="user-cell">
                  <div class="user-avatar"><User :size="14"/></div>
                  {{ user.username }}
                </td>
                <td>
                  <span class="role-badge" :class="user.role">
                    <Shield v-if="user.role === 'admin'" :size="12"/>
                    {{ user.role }}
                  </span>
                </td>
                <td><Clock :size="12"/> {{ new Date(user.created_at).toLocaleDateString() }}</td>
                <td>
                  <button @click="deleteUser(user.id)" class="delete-btn-sc">
                    <Trash2 :size="16"/>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Personalization View -->
    <template v-else-if="activeSubView === 'personalization'">
      <header class="cp-header">
        <div class="header-left">
          <button class="back-btn" @click="activeSubView = 'grid'">
            <ArrowLeft :size="20" />
          </button>
          <h2>Personalización</h2>
        </div>
      </header>

      <div class="cp-content personalization-view">
        <section class="settings-card glass">
          <div class="card-header">
            <ImageIcon :size="20" class="icon-primary"/>
            <h3>Fondo de Pantalla</h3>
          </div>
          <p class="section-desc">Selecciona un fondo para personalizar tu escritorio de NubeOS.</p>

          <div class="wallpaper-selector">
            <!-- Botón de Subida -->
            <div 
              class="wp-thumb upload-thumb glass"
              @click="wallpaperInput?.click()"
            >
              <input 
                ref="wallpaperInput"
                type="file" 
                accept="image/*" 
                class="hidden-input" 
                @change="handleWallpaperUpload"
              >
              <div v-if="isUploadingWallpaper" class="spin-container">
                <RefreshCw class="spin" :size="24" />
              </div>
              <div v-else class="upload-content">
                <UserPlus :size="24" />
                <span>Subir Imagen</span>
              </div>
            </div>

            <div 
              v-for="wp in wallpapers" 
              :key="wp.url"
              class="wp-thumb"
              :class="{ active: desktop.wallpaper === wp.url }"
              @click="desktop.setWallpaper(wp.url)"
              :style="{ backgroundImage: `url(${wp.url})` }"
            >
              <div v-if="wp.type === 'custom'" class="delete-wp-btn" @click.stop="deleteWallpaper(wp.url)">
                <Trash2 :size="14" />
              </div>
              <div class="wp-label">{{ wp.name }}</div>
            </div>
          </div>
        </section>
      </div>
    </template>

    <!-- Global Create User Modal -->
    <div v-if="showCreateModal" class="modal-overlay">
      <div class="modal glass">
        <h3>Crear Nuevo Usuario</h3>
        <div class="form-group">
          <label>Nombre de usuario</label>
          <input v-model="newUser.username" type="text" placeholder="Ej: maria_perez">
        </div>
        <div class="form-group">
          <label>Contraseña</label>
          <input v-model="newUser.password" type="password" placeholder="••••••••">
        </div>
        <div class="form-group">
          <label>Rol</label>
          <select v-model="newUser.role">
            <option value="user">Usuario Estándar</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <div class="modal-actions">
          <button @click="showCreateModal = false" class="btn-cancel">Cancelar</button>
          <button @click="createUser" class="btn-confirm">Crear Usuario</button>
        </div>
      </div>
    </div>

    <!-- Updating Overlay -->
    <div v-if="isUpdating" class="modal-overlay">
      <div class="modal glass align-center">
        <RefreshCw :size="48" class="spin icon-primary mb-1" />
        <h3>{{ updateStatus.step === 'restarting' ? 'Reiniciando...' : 'Actualizando NubeOS' }}</h3>
        
        <div class="update-progress-container">
          <div class="progress-info">
            <span class="step-text">{{ updateStatus.message }}</span>
            <span class="percentage-text">{{ updateStatus.progress }}%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" :style="{ width: updateStatus.progress + '%' }"></div>
          </div>
        </div>

        <p class="loader-subtext">Por favor, no cierres esta ventana. El sistema se sincronizará y aplicará los cambios automáticamente.</p>
      </div>
    </div>

    <!-- Update Confirmation Modal -->
    <div v-if="showUpdateConfirm" class="modal-overlay">
      <div class="modal glass">
        <div class="align-center">
          <RefreshCw :size="48" class="icon-primary mb-1" />
          <h3>Actualizar Sistema</h3>
        </div>
        <p class="modal-text">¿Deseas buscar actualizaciones en el repositorio de GitHub y aplicarlas ahora? El sistema se sincronizará automáticamente.</p>
        <div class="modal-actions">
          <button @click="showUpdateConfirm = false" class="btn-cancel">Cancelar</button>
          <button @click="performUpdate" class="btn-confirm">Actualizar Ahora</button>
        </div>
      </div>
    </div>

    <!-- Update Result Modal -->
    <div v-if="updateResult" class="modal-overlay">
      <div class="modal glass">
        <div class="align-center">
          <component 
            :is="updateResult.success ? ShieldCheck : Unplug" 
            :size="48" 
            :class="updateResult.success ? 'text-success' : 'text-danger'"
            class="mb-1"
          />
          <h3>{{ updateResult.success ? '¡Actualizado!' : 'Error de Actualización' }}</h3>
        </div>
        <div class="result-details">
          <p class="result-msg">{{ updateResult.message }}</p>
          <pre v-if="updateResult.details" class="details-box">{{ updateResult.details }}</pre>
          <p v-if="updateResult.path" class="path-info">Ruta: <code>{{ updateResult.path }}</code></p>
        </div>
        <div class="modal-actions">
          <button @click="updateResult = null" class="btn-confirm">Entendido</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.control-panel-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8fafc;
  color: #1e293b;
}

.cp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  min-height: 70px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cp-header h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #334155;
}

.back-btn {
  background: transparent;
  color: #64748b;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn:hover { background: #f1f5f9; color: #334155; }

.search-box {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  width: 280px;
}

.search-box input { background: transparent; border: none; outline: none; width: 100%; font-size: 0.85rem; }

.cp-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 1rem;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 0.5rem;
}

.cp-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 12px;
  width: 120px;
  cursor: pointer;
  transition: all 0.2s;
}

.cp-item:hover { background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.05); transform: translateY(-2px); }

.icon-container {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #f8fafc;
}

.item-name { font-size: 0.75rem; font-weight: 600; text-align: center; color: #475569; }

/* User View Styles */
.user-view { background: #f8fafc; }
.table-card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; padding: 1rem; background: #f1f5f9; font-size: 0.7rem; color: #64748b; text-transform: uppercase; }
td { padding: 1rem; font-size: 0.85rem; border-top: 1px solid #e2e8f0; }
.user-cell { display: flex; align-items: center; gap: 0.75rem; font-weight: 600; }
.user-avatar { background: #e2e8f0; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #64748b; }
.role-badge { padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
.role-badge.admin { background: #e0e7ff; color: #4338ca; }
.role-badge.user { background: #f1f5f9; color: #64748b; }
.delete-btn-sc { color: #ef4444; background: transparent; padding: 0.25rem; }
.delete-btn-sc:hover { background: #fee2e2; border-radius: 4px; }

.btn-primary-sc { background: var(--primary); color: white; padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }

/* Modal Styles */
.modal-overlay { position: fixed; top: 0; left:0; right:0; bottom:0; background: rgba(15,23,42,0.8); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal { width: 400px; padding: 2rem; background: white; border-radius: 16px; display: flex; flex-direction: column; gap: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
.modal h3 { font-size: 1.25rem; font-weight: 800; color: #1e293b; }
.form-group { display: flex; flex-direction: column; gap: 0.5rem; }
.form-group label { font-size: 0.8rem; font-weight: 600; color: #64748b; }
.form-group input, .form-group select { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 0.75rem; border-radius: 8px; outline: none; font-size: 0.9rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
.btn-cancel { background: transparent; color: #64748b; padding: 0.75rem 1.25rem; font-weight: 600; }
.btn-confirm { background: var(--primary); color: white; padding: 0.75rem 1.25rem; border-radius: 8px; font-weight: 700; }

/* Personalization View */
.wallpaper-selector { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
.wp-thumb { aspect-ratio: 16/10; border-radius: 10px; background-size: cover; background-position: center; cursor: pointer; border: 4px solid transparent; transition: 0.2s; }
.wp-thumb.active { border-color: var(--primary); box-shadow: 0 4px 12px rgba(99,102,241,0.3); }
.wp-label { position: absolute; bottom:0; left:0; right:0; background: rgba(0,0,0,0.5); padding: 0.4rem; color: white; font-size: 0.7rem; text-align: center; }

.delete-wp-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 28px;
  height: 28px;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s;
  z-index: 10;
}

.wp-thumb:hover .delete-wp-btn {
  opacity: 1;
}

.delete-wp-btn:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.upload-thumb {
  border: 2px dashed #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  color: #64748b;
}

.upload-thumb:hover {
  background: #f1f5f9;
  border-color: var(--primary);
  color: var(--primary);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.hidden-input { display: none; }
.spin-container { display: flex; align-items: center; justify-content: center; }

/* Progress Bar Styles */
.update-progress-container {
  width: 100%;
  margin: 1rem 0;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.progress-bar-bg {
  width: 100%;
  height: 8px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 4px;
  transition: width 0.5s ease;
}

/* Custom Scrollbar */
.cp-content::-webkit-scrollbar { width: 4px; }
.cp-content::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }

.align-center { align-items: center; text-align: center; }
.spin { animation: spin 2s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.loader-subtext { font-size: 0.75rem; color: #94a3b8; margin-top: -0.5rem; }

.mb-1 { margin-bottom: 1rem; }
.modal-text { font-size: 0.9rem; color: #475569; line-height: 1.5; text-align: center; }
.result-details { display: flex; flex-direction: column; gap: 0.75rem; max-height: 300px; overflow-y: auto; }
.result-msg { font-weight: 600; color: #1e293b; text-align: center; }
.details-box { background: #f1f5f9; padding: 1rem; border-radius: 8px; font-family: monospace; font-size: 0.75rem; color: #334155; white-space: pre-wrap; word-break: break-all; border: 1px solid #e2e8f0; }
.path-info { font-size: 0.7rem; color: #64748b; }
.text-success { color: #10b981; }
.text-danger { color: #ef4444; }
</style>
