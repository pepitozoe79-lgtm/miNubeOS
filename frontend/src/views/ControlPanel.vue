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
        isUpdating.value = false; // <-- ESTO FALTABA
        
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

const systemStats = ref<any>(null);

const fetchStats = async () => {
  try {
    const res = await axios.get('/api/system/stats');
    systemStats.value = res.data;
  } catch (err) {
    console.error('Error fetching system stats');
  }
};

// Network State
const networkInterfaces = ref<any[]>([]);
const selectedIface = ref<any>(null);
const networkForm = ref({
  connection: '',
  method: 'auto',
  ip: '',
  mask: '24',
  gateway: '',
  dns: '8.8.8.8,1.1.1.1'
});
const isSavingNetwork = ref(false);

const fetchNetwork = async () => {
  try {
    const res = await axios.get('/api/network');
    networkInterfaces.value = res.data.interfaces;
    if (networkInterfaces.value.length > 0 && !selectedIface.value) {
      selectInterface(networkInterfaces.value[0]);
    }
  } catch (err) {
    console.error('Error fetching network info');
  }
};

const selectInterface = (iface: any) => {
  selectedIface.value = iface;
  networkForm.value = {
    connection: iface.connection,
    method: iface.method === 'manual' ? 'manual' : 'auto',
    ip: iface.ip,
    mask: '24',
    gateway: iface.gateway || '',
    dns: iface.dns || '8.8.8.8,1.1.1.1'
  };
};

const saveNetwork = async () => {
  if (!confirm('¿Estás seguro? Si la configuración es incorrecta, podrías perder el acceso al servidor.')) return;
  
  isSavingNetwork.value = true;
  try {
    const res = await axios.post('/api/network/save', networkForm.value);
    alert(res.data.message);
    fetchNetwork();
  } catch (err: any) {
    alert(err.response?.data?.error || 'Error al guardar configuración');
  } finally {
    isSavingNetwork.value = false;
  }
};

// Storage State
const storageInfo = ref<any>(null);
const selectedDisk = ref<any>(null);

const fetchStorage = async () => {
  try {
    const res = await axios.get('/api/storage/info');
    storageInfo.value = res.data;
    if (storageInfo.value.disks?.length > 0 && !selectedDisk.value) {
      selectedDisk.value = storageInfo.value.disks[0];
    }
  } catch (err) {
    console.error('Error fetching storage info');
  }
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const handleItemClick = (id: string) => {
  if (id === 'personalization') {
    activeSubView.value = 'personalization';
  } else if (id === 'user') {
    activeSubView.value = 'user';
    fetchUsers();
  } else if (id === 'update') {
    showUpdateConfirm.value = true;
  } else if (id === 'overview') {
    activeSubView.value = 'overview';
    fetchStats();
  } else if (id === 'network') {
    activeSubView.value = 'network';
    fetchNetwork();
  } else if (['volume', 'storage_pool', 'hdd', 'vdisk', 'ext_storage'].includes(id)) {
    activeSubView.value = 'storage';
    fetchStorage();
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

    <!-- System Overview View -->
    <template v-else-if="activeSubView === 'overview'">
      <header class="cp-header">
        <div class="header-left">
          <button class="back-btn" @click="activeSubView = 'grid'">
            <ArrowLeft :size="20" />
          </button>
          <h2>Información del Sistema</h2>
        </div>
        <button @click="fetchStats" class="btn-refresh">
          <RefreshCw :size="16" />
        </button>
      </header>

      <div class="cp-content overview-view">
        <div v-if="systemStats" class="stats-grid">
          <div class="stat-card glass">
            <div class="stat-icon cpu"><Cpu :size="24" /></div>
            <div class="stat-info">
              <span class="stat-label">CPU</span>
              <span class="stat-value">{{ systemStats.cpu }}%</span>
              <div class="mini-progress-bar"><div class="fill" :style="{ width: systemStats.cpu + '%' }"></div></div>
            </div>
          </div>
          <div class="stat-card glass">
            <div class="stat-icon ram"><Activity :size="24" /></div>
            <div class="stat-info">
              <span class="stat-label">RAM</span>
              <span class="stat-value">{{ systemStats.ram }}%</span>
              <div class="mini-progress-bar"><div class="fill" :style="{ width: systemStats.ram + '%' }"></div></div>
            </div>
          </div>
          <div class="stat-card glass">
            <div class="stat-icon disk"><Database :size="24" /></div>
            <div class="stat-info">
              <span class="stat-label">Disco (Almacenamiento)</span>
              <span class="stat-value">{{ systemStats.disk }}%</span>
              <div class="mini-progress-bar"><div class="fill theme-disk" :style="{ width: systemStats.disk + '%' }"></div></div>
            </div>
          </div>
        </div>

        <section class="settings-card glass mt-1">
          <div class="card-header">
            <Info :size="20" class="icon-primary"/>
            <h3>Detalles de NubeOS</h3>
          </div>
          <div class="info-list">
            <div class="info-row">
              <span class="label">Versión del Sistema (Hash)</span>
              <span class="value code">{{ systemStats?.version || 'Descargando...' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Plataforma</span>
              <span class="value">Linux (NubeOS Server)</span>
            </div>
            <div class="info-row">
              <span class="label">Uptime</span>
              <span class="value">{{ Math.floor((systemStats?.details?.uptime || 0) / 3600) }} horas</span>
            </div>
          </div>
        </section>
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

    <!-- Storage Management View -->
    <template v-else-if="activeSubView === 'storage'">
      <header class="cp-header">
        <div class="header-left">
          <button class="back-btn" @click="activeSubView = 'grid'">
            <ArrowLeft :size="20" />
          </button>
          <h2>Administrador de Almacenamiento</h2>
        </div>
        <button @click="fetchStorage" class="btn-refresh">
          <RefreshCw :size="16" />
        </button>
      </header>

      <div class="cp-content storage-view">
        <div class="storage-layout">
          <!-- Disk List -->
          <div class="disk-sidebar glass">
            <h4 class="sidebar-title">Unidades Físicas</h4>
            <div 
              v-for="disk in storageInfo?.disks" 
              :key="disk.name"
              class="disk-card"
              :class="{ active: selectedDisk?.name === disk.name }"
              @click="selectedDisk = disk"
            >
              <HardDrive :size="20" />
              <div class="disk-info">
                <span class="disk-name">{{ disk.model || disk.name }}</span>
                <span class="disk-size">{{ formatBytes(disk.size) }}</span>
              </div>
            </div>
          </div>

          <!-- Partition Details -->
          <div v-if="selectedDisk" class="partition-pane settings-card glass">
            <div class="card-header">
              <Database :size="20" class="icon-primary"/>
              <h3>Detalles del Disco: {{ selectedDisk.name }}</h3>
            </div>
            
            <div class="disk-metadata">
              <div class="meta-item"><span class="label">Modelo:</span> <span class="val">{{ selectedDisk.model || 'N/A' }}</span></div>
              <div class="meta-item"><span class="label">Serie:</span> <span class="val">{{ selectedDisk.serial || 'N/A' }}</span></div>
              <div class="meta-item"><span class="label">Estado:</span> <span class="val status-ok">{{ selectedDisk.state || 'Normal' }}</span></div>
            </div>

            <div class="partition-list mt-1">
              <h4 class="sub-title">Particiones y Volúmenes</h4>
              <div v-if="!selectedDisk.children?.length" class="empty-parts">Sin particiones detectadas</div>
              <div 
                v-for="part in selectedDisk.children" 
                :key="part.name"
                class="part-row glass"
              >
                <div class="part-main">
                  <Layers :size="18" class="icon-primary" />
                  <div class="part-details">
                    <span class="part-name">{{ part.name }} <small v-if="part.fstype">({{ part.fstype }})</small></span>
                    <span class="part-mount" v-if="part.mountpoint">Montado en: <code>{{ part.mountpoint }}</code></span>
                  </div>
                  <span class="part-size">{{ formatBytes(part.size) }}</span>
                </div>
                <!-- Sub-partitions (like LVM or nested parts) -->
                <div v-if="part.children?.length" class="sub-parts-list">
                  <div v-for="sub in part.children" :key="sub.name" class="sub-part">
                    <ArrowLeft :size="12" class="rotate-down" />
                    <span>{{ sub.name }} - {{ sub.fstype }} ({{ formatBytes(sub.size) }})</span>
                    <code v-if="sub.mountpoint">{{ sub.mountpoint }}</code>
                  </div>
                </div>
              </div>
            </div>

            <div class="warning-box mt-1">
              <Shield :size="16" />
              <span>Para realizar operaciones de formateo o particionado avanzado, se recomienda usar la terminal de NubeOS para mayor seguridad.</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Network Management View -->
    <template v-else-if="activeSubView === 'network'">
      <header class="cp-header">
        <div class="header-left">
          <button class="back-btn" @click="activeSubView = 'grid'">
            <ArrowLeft :size="20" />
          </button>
          <h2>Gestión de Red</h2>
        </div>
      </header>

      <div class="cp-content network-view">
        <div class="network-layout">
          <!-- Interface List -->
          <div class="iface-sidebar glass">
            <h4 class="sidebar-title">Interfaces</h4>
            <div 
              v-for="iface in networkInterfaces" 
              :key="iface.name"
              class="iface-card"
              :class="{ active: selectedIface?.name === iface.name }"
              @click="selectInterface(iface)"
            >
              <Network :size="20" />
              <div class="iface-info">
                <span class="iface-name">{{ iface.name }}</span>
                <span class="iface-status" :class="iface.state">{{ iface.state }}</span>
              </div>
            </div>
          </div>

          <!-- Config Form -->
          <div v-if="selectedIface" class="config-pane settings-card glass">
            <div class="card-header">
              <Globe :size="20" class="icon-primary"/>
              <h3>Configurar {{ selectedIface.name }}</h3>
            </div>

            <div class="network-form">
              <div class="form-group-row">
                <label>Método de Red</label>
                <div class="toggle-group">
                  <button 
                    type="button"
                    :class="{ active: networkForm.method === 'auto' }"
                    @click="networkForm.method = 'auto'"
                  >DHCP (Automático)</button>
                  <button 
                    type="button"
                    :class="{ active: networkForm.method === 'manual' }"
                    @click="networkForm.method = 'manual'"
                  >Estático (Manual)</button>
                </div>
              </div>

              <div v-show="networkForm.method === 'manual'" class="static-fields fade-in">
                <div class="form-group mt-1">
                  <label>Dirección IP</label>
                  <input 
                    v-model="networkForm.ip" 
                    type="text" 
                    placeholder="Ej: 192.168.1.100" 
                    class="cp-input"
                    @click.stop
                  >
                </div>
                <div class="form-group mt-1">
                  <label>Máscara de Prefijo (Bitmask)</label>
                  <input 
                    v-model="networkForm.mask" 
                    type="number" 
                    placeholder="Ej: 24" 
                    class="cp-input"
                    @click.stop
                  >
                </div>
                <div class="form-group mt-1">
                  <label>Puerta de Enlace (Gateway)</label>
                  <input 
                    v-model="networkForm.gateway" 
                    type="text" 
                    placeholder="Ej: 192.168.1.1" 
                    class="cp-input"
                    @click.stop
                  >
                </div>
                <div class="form-group mt-1">
                  <label>Servidores DNS (separados por coma)</label>
                  <input 
                    v-model="networkForm.dns" 
                    type="text" 
                    placeholder="Ej: 8.8.8.8,1.1.1.1" 
                    class="cp-input"
                    @click.stop
                  >
                </div>
              </div>

              <div v-show="networkForm.method === 'auto'" class="dhcp-info mt-1 glass">
                <p>La interfaz recibirá una dirección IP automáticamente desde el servidor DHCP de tu red.</p>
                <div v-if="selectedIface.ip" class="current-ip">
                  IP Actual: <strong>{{ selectedIface.ip }}</strong>
                </div>
              </div>

              <div class="warning-box mt-1">
                <Shield :size="16" />
                <span>Advertencia: Cambiar la configuración de red puede causar la pérdida inmediata de conexión con el Panel de Control.</span>
              </div>

              <div class="form-actions mt-1">
                <button 
                  class="btn-confirm w-full" 
                  @click="saveNetwork"
                  :disabled="isSavingNetwork"
                >
                  <RefreshCw v-if="isSavingNetwork" class="spin" :size="16" />
                  <span v-else>Aplicar Cambios</span>
                </button>
              </div>
            </div>
          </div>
        </div>
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

.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
.stat-card { padding: 1.25rem; display: flex; align-items: center; gap: 1rem; }
.stat-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; }
.stat-icon.cpu { background: #6366f1; }
.stat-icon.ram { background: #10b981; }
.stat-icon.disk { background: #f59e0b; }
.stat-info { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
.stat-label { font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
.stat-value { font-size: 1.25rem; font-weight: 800; color: #1e293b; }
.mini-progress-bar { width: 100%; height: 4px; background: #f1f5f9; border-radius: 2px; }
.mini-progress-bar .fill { height: 100%; border-radius: 2px; background: var(--primary); }
.mini-progress-bar .theme-disk { background: #f59e0b; }

.info-list { display: flex; flex-direction: column; gap: 0.75rem; padding-top: 1rem; }
.info-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #f1f5f9; }
.info-row:last-child { border-bottom: none; }
.info-row .label { font-size: 0.85rem; color: #64748b; }
.info-row .value { font-size: 0.85rem; font-weight: 700; color: #1e293b; }
.info-row .value.code { font-family: monospace; background: #f1f5f9; padding: 0.2rem 0.5rem; border-radius: 4px; border: 1px solid #e2e8f0; }

.config-pane { background: #334155 !important; color: white; }
.card-header h3 { color: white !important; }
.sidebar-title { color: #cbd5e1; }
.iface-card { color: #cbd5e1; }
.iface-name { color: white; }

.form-group label { color: #f8fafc !important; font-weight: 700; font-size: 0.9rem; margin-bottom: 0.5rem; display: block; }
.cp-input { 
  background: white !important; 
  color: #0f172a !important; 
  border: 2px solid #6366f1 !important; 
  padding: 0.8rem !important; 
  font-weight: 600; 
  font-size: 1rem !important;
}
.cp-input::placeholder { color: #94a3b8; }

.toggle-group { background: #1e293b; padding: 0.4rem; }
.toggle-group button { color: #94a3b8; }
.toggle-group button.active { background: #6366f1; color: white; }

.dhcp-info { background: rgba(255,255,255,0.05); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.1); }
.current-ip { color: #818cf8; font-weight: 800; }

.warning-box { background: #450a0a; border: 1px solid #991b1b; color: #fecaca; }

.network-layout { display: grid; grid-template-columns: 200px 1fr; gap: 1.5rem; }
.iface-sidebar { display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem; height: fit-content; }
.sidebar-title { font-size: 0.7rem; text-transform: uppercase; color: #94a3b8; font-weight: 700; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem; margin-bottom: 0.5rem; }
.iface-card { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-radius: 8px; cursor: pointer; transition: 0.2s; color: #64748b; }
.iface-card:hover { background: #f1f5f9; color: #1e293b; }
.iface-card.active { background: var(--primary); color: white; }
.iface-info { display: flex; flex-direction: column; }
.iface-name { font-size: 0.85rem; font-weight: 700; }
.iface-status { font-size: 0.65rem; text-transform: capitalize; }
.iface-status.connected { color: #10b981; }
.iface-card.active .iface-status.connected { color: #ccfbf1; }

.toggle-group { display: flex; background: #f1f5f9; border-radius: 8px; padding: 0.25rem; }
.toggle-group button { flex: 1; padding: 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; color: #64748b; transition: 0.2s; }
.toggle-group button.active { background: white; color: var(--primary); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

.warning-box { background: #fef2f2; border: 1px solid #fee2e2; color: #991b1b; padding: 1rem; border-radius: 8px; display: flex; align-items: flex-start; gap: 0.75rem; font-size: 0.75rem; font-weight: 600; }
.dhcp-info { padding: 1.5rem; text-align: center; color: #64748b; font-size: 0.85rem; }
.current-ip { margin-top: 1rem; color: var(--primary); font-size: 1rem; }

.form-group-row { display: flex; flex-direction: column; gap: 0.75rem; }
.form-group-row label { font-size: 0.85rem; font-weight: 700; color: #334155; }
.w-full { width: 100%; }

.storage-layout { display: grid; grid-template-columns: 240px 1fr; gap: 1.5rem; }
.disk-sidebar { display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem; height: fit-content; background: #1e293b; border: 1px solid rgba(255,255,255,0.05); }
.disk-card { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-radius: 8px; cursor: pointer; transition: 0.2s; color: #94a3b8; }
.disk-card:hover { background: rgba(255,255,255,0.05); color: white; }
.disk-card.active { background: #6366f1; color: white; }
.disk-info { display: flex; flex-direction: column; overflow: hidden; }
.disk-name { font-size: 0.8rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.disk-size { font-size: 0.65rem; opacity: 0.7; }

.disk-metadata { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 8px; margin-top: 1rem; }
.meta-item { display: flex; flex-direction: column; gap: 0.25rem; }
.meta-item .label { font-size: 0.65rem; color: #94a3b8; text-transform: uppercase; }
.meta-item .val { font-size: 0.85rem; font-weight: 600; color: white; }
.status-ok { color: #10b981 !important; }

.sub-title { font-size: 0.75rem; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05rem; margin-bottom: 0.75rem; }
.part-row { padding: 1rem; margin-bottom: 0.5rem; border: 1px solid rgba(255,255,255,0.05); }
.part-main { display: flex; align-items: center; gap: 1rem; }
.part-details { flex: 1; display: flex; flex-direction: column; gap: 0.1rem; }
.part-name { font-size: 0.85rem; font-weight: 700; color: white; }
.part-mount { font-size: 0.7rem; color: #94a3b8; }
.part-size { font-size: 0.85rem; font-weight: 700; color: #818cf8; }

.sub-parts-list { margin-top: 0.75rem; padding-left: 1.5rem; border-left: 1px dashed rgba(255,255,255,0.1); margin-left: 0.5rem; display: flex; flex-direction: column; gap: 0.4rem; }
.sub-part { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: #94a3b8; }
.rotate-down { transform: rotate(-90deg); }
.sub-part code { background: rgba(255,255,255,0.05); padding: 0.1rem 0.3rem; border-radius: 3px; font-size: 0.65rem; }

.empty-parts { text-align: center; padding: 2rem; color: #64748b; font-size: 0.85rem; font-style: italic; }

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
