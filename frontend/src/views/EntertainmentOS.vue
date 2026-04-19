<template>
  <div class="eos-container">
    <!-- Sidebar -->
    <aside class="eos-sidebar">
      <div class="eos-sidebar-logo">
        <Clapperboard :size="22" />
        <span>EntertainmentOS</span>
      </div>
      <nav class="eos-sidebar-nav">
        <button
          v-for="item in navItems"
          :key="item.id"
          class="eos-nav-item"
          :class="{ active: activeNav === item.id }"
          @click="activeNav = item.id"
        >
          <component :is="item.icon" :size="20" />
          <span>{{ item.label }}</span>
        </button>
      </nav>
      <div class="eos-sidebar-footer">
      </div>
    </aside>

    <!-- Main Content -->
    <div class="eos-main">
      <!-- Top Bar -->
      <header class="eos-topbar">
        <div class="eos-search-box">
          <Search :size="16" />
          <input type="text" placeholder="Buscar películas, series, música..." v-model="searchQuery" />
        </div>
        <div class="eos-topbar-right">
          <button class="eos-icon-btn" title="Notificaciones">
            <Bell :size="18" />
            <span class="eos-badge">3</span>
          </button>
          <div class="eos-user-pill">
            <div class="eos-user-avatar">
              <User :size="16" />
            </div>
            <span>Administrador</span>
            <ChevronDown :size="14" />
          </div>
        </div>
      </header>

      <!-- Content Area -->
      <div class="eos-content" ref="contentRef">
        
        <!-- Loading State -->
        <div v-if="loading && allMedia.length === 0" class="eos-loading-screen">
          <Loader2 class="spinning" :size="48" />
          <p>Cargando tu biblioteca...</p>
        </div>

        <!-- Home View -->
        <template v-if="activeNav === 'home' && !loading">
          <!-- Hero -->
          <section class="eos-hero" v-if="heroItems.length > 0">
            <div class="eos-hero-slider" :style="{ transform: `translateX(-${heroIndex * 100}%)` }">
              <div
                v-for="(item, i) in heroItems"
                :key="'hero-'+i"
                class="eos-hero-slide"
                :style="{ backgroundImage: `url(${item.banner})` }"
              >
                <div class="eos-hero-overlay"></div>
                <div class="eos-hero-content">
                  <h1 class="eos-hero-title">{{ item.title }}</h1>
                  <div class="eos-hero-meta">
                    <span class="eos-rating-badge">{{ item.rating }}</span>
                    <span>{{ item.duration }}</span>
                    <span>{{ item.genre }}</span>
                    <span>{{ item.year }}</span>
                  </div>
                  <p class="eos-hero-desc">{{ item.description }}</p>
                  <div class="eos-hero-actions">
                    <button class="eos-btn-primary" @click="playMedia(item)">
                      <Play :size="18" /> Reproducir
                    </button>
                    <button class="eos-btn-secondary" @click="openMediaDetail(item)">
                      <Info :size="18" /> Más Info
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <button class="eos-hero-arrow left" @click="prevHero"><ChevronLeft :size="28" /></button>
            <button class="eos-hero-arrow right" @click="nextHero"><ChevronRight :size="28" /></button>
          </section>

          <!-- Sections -->
          <section class="eos-media-section" v-for="section in mediaSections" :key="section.title">
            <div class="eos-section-header">
              <h2>{{ section.title }}</h2>
            </div>
            <div class="eos-media-row" v-if="section.items.length > 0">
              <div
                v-for="media in section.items"
                :key="'sec-'+media.id"
                class="eos-media-card"
                @click="openMediaDetail(media)"
              >
                <div class="eos-card-poster">
                  <img :src="media.poster" :alt="media.title" loading="lazy" />
                  <div class="eos-card-overlay">
                    <button class="eos-play-btn"><Play :size="24" /></button>
                  </div>
                  <span v-if="media.is_new" class="eos-new-badge">NUEVO</span>
                </div>
                <div class="eos-card-info">
                  <div class="eos-card-title">{{ media.title }}</div>
                  <div class="eos-card-meta">{{ media.year }} · {{ media.genre }}</div>
                </div>
              </div>
            </div>
            <div v-else class="eos-empty-section">
               <p>No hay contenido en esta sección.</p>
            </div>
          </section>
        </template>

        <!-- Movies View -->
        <template v-if="activeNav === 'movies'">
          <section class="eos-grid-section">
            <h2 class="eos-page-title">Películas</h2>
            <div class="eos-media-grid" v-if="filteredMedia.filter(m => m.type === 'movie').length > 0">
              <div
                v-for="media in filteredMedia.filter(m => m.type === 'movie')"
                :key="'mov-'+media.id"
                class="eos-media-card"
                @click="openMediaDetail(media)"
              >
                <div class="eos-card-poster">
                  <img :src="media.poster" :alt="media.title" loading="lazy" />
                  <div class="eos-card-overlay">
                    <button class="eos-play-btn"><Play :size="24" /></button>
                  </div>
                </div>
                <div class="eos-card-info">
                  <div class="eos-card-title">{{ media.title }}</div>
                  <div class="eos-card-meta">{{ media.year }} · {{ media.genre }}</div>
                </div>
              </div>
            </div>
            <div v-else class="eos-empty-grid">Sin resultados</div>
          </section>
        </template>

        <!-- Series View -->
        <template v-if="activeNav === 'series'">
          <section class="eos-grid-section">
            <h2 class="eos-page-title">Series</h2>
            <div class="eos-media-grid" v-if="seriesMedia.length > 0">
              <div
                v-for="media in seriesMedia"
                :key="'ser-'+media.id"
                class="eos-media-card"
                @click="openMediaDetail(media)"
              >
                <div class="eos-card-poster">
                  <img :src="media.poster" :alt="media.title" loading="lazy" />
                  <div class="eos-card-overlay">
                    <button class="eos-play-btn"><Play :size="24" /></button>
                  </div>
                </div>
                <div class="eos-card-info">
                  <div class="eos-card-title">{{ media.title }}</div>
                  <div class="eos-card-meta">{{ media.genre }}</div>
                </div>
              </div>
            </div>
            <div v-else class="eos-empty-grid">Sin series disponibles</div>
          </section>
        </template>

        <!-- Music View -->
        <template v-if="activeNav === 'music'">
          <section class="eos-grid-section">
            <h2 class="eos-page-title">Música</h2>
            <div class="eos-music-grid" v-if="musicTracks.length > 0">
              <div v-for="track in musicTracks" :key="'mus-'+track.id" class="eos-music-card">
                <div class="eos-music-cover">
                  <div class="eos-music-cover-art" :style="{ background: track.color }">
                    <Music :size="28" />
                  </div>
                  <div class="eos-music-play-overlay">
                    <Play :size="22" />
                  </div>
                </div>
                <div class="eos-music-info">
                  <div class="eos-music-title">{{ track.title }}</div>
                  <div class="eos-music-artist">{{ track.artist }}</div>
                </div>
              </div>
            </div>
            <div v-else class="eos-empty-grid">Sin música</div>
          </section>
        </template>

        <!-- Admin View -->
        <template v-if="activeNav === 'admin'">
          <div class="eos-admin-container">
            <header class="eos-admin-header">
              <h1><Settings2 :size="24" /> Panel de Administración</h1>
              <div class="admin-tabs">
                <button v-for="tab in ['overview', 'media', 'libraries']" :key="tab" 
                        :class="{ active: activeAdminTab === tab }" @click="activeAdminTab = tab">
                  {{ tab === 'overview' ? 'Resumen' : tab === 'media' ? 'Gestión' : 'Librerías' }}
                </button>
              </div>
            </header>

            <div class="eos-admin-content">
              <div v-if="activeAdminTab === 'overview'" class="admin-overview">
                <div class="stats-grid">
                  <div class="stat-card">
                    <Film :size="24" />
                    <div class="stat-val">{{ adminStats.movies }}</div>
                    <div class="stat-label">Películas</div>
                  </div>
                  <div class="stat-card">
                    <Tv :size="24" />
                    <div class="stat-val">{{ adminStats.series }}</div>
                    <div class="stat-label">Series</div>
                  </div>
                  <div class="stat-card">
                    <Music :size="24" />
                    <div class="stat-val">{{ adminStats.music }}</div>
                    <div class="stat-label">Canciones</div>
                  </div>
                  <div class="stat-card warning" v-if="adminStats.noPoster > 0">
                    <Info :size="24" />
                    <div class="stat-val">{{ adminStats.noPoster }}</div>
                    <div class="stat-label">Sin Poster</div>
                  </div>
                </div>
              </div>

              <div v-if="activeAdminTab === 'media'" class="admin-media-table">
                <div class="table-search">
                  <input v-model="adminSearch" type="text" placeholder="Buscar por título..." />
                </div>
                <div class="eos-scroll-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Título</th>
                        <th>Tipo</th>
                        <th>Género</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="m in filteredAdminMedia" :key="'adm-'+m.id">
                        <td>{{ m.title || 'Sin título' }}</td>
                        <td><span class="type-badge">{{ m.type }}</span></td>
                        <td>{{ m.genre || 'Desconocido' }}</td>
                        <td class="table-btns">
                          <button @click="editMedia(m)" class="btn-edit" title="Editar"><Star :size="14" /></button>
                          <button @click="deleteMedia(m.id)" class="btn-del" title="Eliminar"><Trash2 :size="14" /></button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div v-if="activeAdminTab === 'libraries'" class="admin-libraries">
                <div class="admin-section-card">
                  <h3>Añadir Nueva Librería</h3>
                  <div class="lib-add-form">
                    <input v-model="newLibPath" type="text" placeholder="Ruta: /mnt/videos" />
                    <button @click="openFolderPicker" class="eos-btn-info" title="Explorar Sistema">
                      <Folder :size="18" />
                    </button>
                    <button @click="addLibrary" class="eos-btn-primary">Añadir</button>
                  </div>
                  <div class="lib-list">
                    <div v-for="lib in libraries" :key="'lib-'+lib.id" class="lib-item">
                      <div class="lib-info">
                        <div class="lib-name">{{ lib.name }}</div>
                        <div class="lib-path">{{ lib.path }}</div>
                      </div>
                      <button @click="removeLibrary(lib.id)" class="lib-remove-btn"><Trash2 :size="14" /></button>
                    </div>
                  </div>
                  <div class="mt-4">
                    <button @click="scanLibraries" class="eos-btn-secondary" :disabled="scanning">
                      <Loader2 v-if="scanning" class="spinning" :size="16" />
                      <span v-else>Escanear Servidor</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Detail Modal -->
      <Transition name="modal-fade">
        <div v-if="selectedMedia" class="eos-modal-overlay" @click.self="selectedMedia = null">
          <div class="eos-modal">
            <button class="eos-modal-close" @click="selectedMedia = null"><X :size="20" /></button>
            <div class="eos-modal-banner" :style="{ backgroundImage: `url(${selectedMedia.poster})` }">
              <div class="eos-modal-banner-content">
                <h2>{{ selectedMedia.title }}</h2>
              </div>
            </div>
            <div class="eos-modal-body">
              <p class="eos-modal-desc">{{ selectedMedia.description || 'Sin descripción disponible.' }}</p>
              
              <div v-if="selectedMedia.isSeriesGroup" class="eos-episodes-list">
                <h3>Episodios</h3>
                <div v-for="ep in getEpisodes(selectedMedia.series_name)" :key="'ep-'+ep.id" class="eos-episode-item" @click="playMedia(ep)">
                  <div class="eos-ep-num">T{{ ep.season }} E{{ ep.episode }}</div>
                  <div class="eos-ep-title">{{ ep.title }}</div>
                  <button class="eos-ep-play"><Play :size="14" /></button>
                </div>
              </div>

              <div v-else class="eos-modal-actions">
                <button class="eos-btn-primary" @click="playMedia(selectedMedia)"><Play :size="18" /> Reproducir</button>
                <button class="eos-btn-secondary"><Plus :size="18" /> Favoritos</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Folder Picker Modal -->
      <Transition name="modal-fade">
        <div v-if="showFolderPicker" class="eos-modal-overlay" @click.self="showFolderPicker = false">
          <div class="eos-modal folder-browser-modal">
            <header class="eos-modal-header-simple">
              <h3>Seleccionar Carpeta</h3>
              <button class="eos-modal-close-small" @click="showFolderPicker = false"><X :size="18" /></button>
            </header>
            
            <div class="browser-path-bar">
               <span class="path-label">Ruta actual:</span>
               <span class="path-value">{{ currentBrowserPath }}</span>
            </div>

            <div class="browser-list">
              <div v-if="browsingLoading" class="browser-loading">
                <Loader2 class="spinning" :size="24" />
              </div>
              <template v-else>
                <!-- Parent Directory -->
                <div v-if="currentBrowserPath !== browserParent" 
                     class="browser-item parent" @click="fetchFsDir(browserParent)">
                  <Folder :size="18" />
                  <span>.. (Subir nivel)</span>
                </div>
                <!-- Folders -->
                <div v-for="folder in browserFolders" :key="folder.path" 
                     class="browser-item" @click="selectBrowserFolder(folder.path)">
                  <Folder :size="18" />
                  <span>{{ folder.name }}</span>
                  <ChevronRight :size="14" class="ml-auto" />
                </div>
                <div v-if="browserFolders.length === 0" class="browser-empty">
                  Esta carpeta está vacía o no tiene subcarpetas.
                </div>
              </template>
            </div>

            <footer class="eos-modal-footer">
              <button class="eos-btn-secondary" @click="showFolderPicker = false">Cancelar</button>
              <button class="eos-btn-primary" @click="confirmFolder">Seleccionar esta carpeta</button>
            </footer>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import {
  Clapperboard, Home, Film, Tv, Music, Search, Bell, User, ChevronDown,
  ChevronLeft, ChevronRight, Play, Info, Settings2, X, Plus, Star, Loader2, Trash2, Folder
} from 'lucide-vue-next';
import axios from 'axios';
import { useDesktopStore } from '../stores/desktop';
import { useNotificationStore } from '../stores/notification';

const desktop = useDesktopStore();
const notification = useNotificationStore();

// UI State
const activeNav = ref('home');
const activeAdminTab = ref('overview');
const loading = ref(false);
const scanning = ref(false);
const searchQuery = ref('');
const adminSearch = ref('');
const newLibPath = ref('');
const selectedMedia = ref<any>(null);

// Folder Browser State
const showFolderPicker = ref(false);
const currentBrowserPath = ref('');
const browserFolders = ref<any[]>([]);
const browserParent = ref('');
const browsingLoading = ref(false);

const navItems = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'movies', label: 'Películas', icon: Film },
  { id: 'series', label: 'Series', icon: Tv },
  { id: 'music', label: 'Música', icon: Music },
  { id: 'admin', label: 'Dashboard', icon: Settings2 },
];

// Data State
const allMedia = ref<any[]>([]);
const libraries = ref<any[]>([]);
const adminStats = ref({ movies: 0, series: 0, music: 0, noPoster: 0, lastAdded: [] });

// Computed
const filteredMedia = computed(() => {
  if (!searchQuery.value) return allMedia.value;
  const q = searchQuery.value.toLowerCase();
  return allMedia.value.filter(m => 
    (m.title || '').toLowerCase().includes(q) || 
    (m.series_name || '').toLowerCase().includes(q)
  );
});

const seriesMedia = computed(() => {
  const series = filteredMedia.value.filter(m => m.type === 'series');
  const unique: any[] = [];
  const seen = new Set();
  series.forEach(s => {
    if (!seen.has(s.series_name)) {
      seen.add(s.series_name);
      unique.push({ ...s, title: s.series_name, isSeriesGroup: true });
    }
  });
  return unique;
});

const getEpisodes = (name: string) => 
  allMedia.value.filter(m => m.series_name === name).sort((a,b) => a.episode - b.episode);

const mediaSections = computed(() => [
  { title: 'Agregados Recientemente', items: allMedia.value.filter(m => m.is_new === 1).slice(0, 10) },
  { title: 'Top Valoradas', items: allMedia.value.filter(m => (m.stars || 0) >= 4).slice(0, 10) }
]);

const musicTracks = computed(() => 
  filteredMedia.value.filter(m => m.type === 'music').map(m => ({
    ...m, artist: m.genre || 'Artista', color: `hsl(${(m.id * 137) % 360}, 60%, 40%)`
  }))
);

const filteredAdminMedia = computed(() => {
  if (!adminSearch.value) return allAdminMedia.value;
  const q = adminSearch.value.toLowerCase();
  return allAdminMedia.value.filter(m => (m.title || '').toLowerCase().includes(q));
});

const allAdminMedia = ref<any[]>([]);

// Hero Data
const heroIndex = ref(0);
const heroItems = [
  { title: 'Stellar Horizon', banner: '/entertainment/posters/hero_banner.png', rating: 'PG-13', duration: '2h 46m', genre: 'Sci-Fi', year: '2026', description: 'Una odisea espacial sin precedentes.' },
  { title: 'Shadow Protocol', banner: '/entertainment/posters/hero_banner_2.png', rating: 'R', duration: '2h 10m', genre: 'Thriller', year: '2026', description: 'Intriga global en la era digital.' }
];

// Methods
const fetchCatalog = async () => {
  loading.value = true;
  try {
    const res = await axios.get('/api/entertainment/catalog');
    allMedia.value = res.data.map((m: any) => ({
      ...m,
      poster: m.poster_path ? `/api/entertainment/poster/${m.id}` : '/entertainment/posters/stellar_horizon.png'
    }));
  } catch (err) {
    notification.error('Error', 'No se pudo cargar el catálogo');
  } finally {
    loading.value = false;
  }
};

const fetchAdminData = async () => {
  try {
    const [stats, media, libs] = await Promise.all([
      axios.get('/api/entertainment/admin/stats'),
      axios.get('/api/entertainment/admin/media'),
      axios.get('/api/entertainment/admin/libraries')
    ]);
    adminStats.value = stats.data;
    allAdminMedia.value = media.data;
    libraries.value = libs.data;
  } catch (err) { /* Not admin */ }
};

const playMedia = (m: any) => {
  if (!m.file_path) return notification.error('Error', 'Archivo no encontrado');
  desktop.playVideo(m.file_path, m.title, m.id, m.progress || 0);
  selectedMedia.value = null;
};

const openMediaDetail = (m: any) => selectedMedia.value = m;

const scanLibraries = async () => {
  scanning.value = true;
  try {
    const res = await axios.post('/api/entertainment/admin/scan');
    notification.success('Escaneo listo', `${res.data.newItems} nuevos encontrados.`);
    fetchCatalog();
  } catch (err) {
    notification.error('Error', 'Fallo al escanear');
  } finally {
    scanning.value = false;
  }
};

const addLibrary = async () => {
  if (!newLibPath.value) return;
  try {
    await axios.post('/api/entertainment/admin/libraries', { path: newLibPath.value, name: 'Nueva' });
    newLibPath.value = '';
    fetchAdminData();
  } catch (err) { notification.error('Error', 'No se pudo añadir'); }
};

const removeLibrary = async (id: number) => {
  try {
    await axios.delete(`/api/entertainment/admin/libraries/${id}`);
    fetchAdminData();
  } catch (err) { notification.error('Error', 'No se pudo eliminar'); }
};

const deleteMedia = async (id: number) => {
  if (!confirm('¿Eliminar del catálogo?')) return;
  try {
    await axios.delete(`/api/entertainment/admin/media/${id}`);
    fetchAdminData();
    fetchCatalog();
  } catch (err) { notification.error('Error', 'No se pudo borrar'); }
};

const editMedia = (media: any) => notification.info('Próximamente', 'Editor visual en desarrollo.');

// Folder Browsing
const openFolderPicker = () => {
  showFolderPicker.value = true;
  fetchFsDir(currentBrowserPath.value || '');
};

const fetchFsDir = async (path: string) => {
  browsingLoading.value = true;
  try {
    const res = await axios.get('/api/entertainment/admin/browse-fs', { params: { path } });
    browserFolders.value = res.data.folders;
    currentBrowserPath.value = res.data.currentPath;
    browserParent.value = res.data.parentPath;
  } catch (err) {
    notification.error('Error', 'No se pudo leer el directorio');
  } finally {
    browsingLoading.value = false;
  }
};

const selectBrowserFolder = (folderPath: string) => {
  fetchFsDir(folderPath);
};

const confirmFolder = () => {
  newLibPath.value = currentBrowserPath.value;
  showFolderPicker.value = false;
};

const prevHero = () => heroIndex.value = (heroIndex.value - 1 + heroItems.length) % heroItems.length;
const nextHero = () => heroIndex.value = (heroIndex.value + 1) % heroItems.length;

// Lifecycle
let heroTimer: any;
onMounted(() => {
  fetchCatalog();
  if (activeNav.value === 'admin') fetchAdminData();
  heroTimer = setInterval(nextHero, 8000);
});
onUnmounted(() => clearInterval(heroTimer));

watch(activeNav, (val) => {
  if (val === 'admin') fetchAdminData();
});
</script>

<style scoped>
.eos-container { display: flex; width: 100%; height: 100%; background: #0b1120; color: #e2e8f0; font-family: 'Inter', sans-serif; overflow: hidden; }
.eos-sidebar { width: 70px; background: rgba(8, 15, 30, 0.95); border-right: 1px solid rgba(255, 255, 255, 0.05); display: flex; flex-direction: column; align-items: center; padding: 1rem 0; z-index: 10; }
.eos-sidebar-logo { color: #f59e0b; margin-bottom: 2rem; display: flex; flex-direction: column; align-items: center; font-size: 0.5rem; gap: 4px; }
.eos-nav-item { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 0.75rem 0.5rem; color: #64748b; background: none; border: none; cursor: pointer; font-size: 0.6rem; transition: all 0.2s; width: 60px; }
.eos-nav-item.active { color: #f59e0b; background: rgba(245, 158, 11, 0.1); border-radius: 12px; }
.eos-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.eos-topbar { height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; background: rgba(11, 17, 32, 0.8); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
.eos-search-box { display: flex; align-items: center; gap: 0.5rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 0.5rem 1rem; width: 300px; }
.eos-search-box input { background: none; border: none; color: white; outline: none; font-size: 0.85rem; width: 100%; }
.eos-user-pill { display: flex; align-items: center; gap: 0.5rem; background: rgba(255, 255, 255, 0.05); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; }
.eos-content { flex: 1; overflow-y: auto; padding-bottom: 3rem; position: relative; }
.eos-loading-screen { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0b1120; z-index: 20; color: #64748b; gap: 1rem; }
.eos-hero { position: relative; height: 400px; overflow: hidden; }
.eos-hero-slider { display: flex; height: 100%; transition: transform 0.6s ease; }
.eos-hero-slide { min-width: 100%; background-size: cover; background-position: center; position: relative; display: flex; align-items: flex-end; padding: 3rem; }
.eos-hero-overlay { position: absolute; inset: 0; background: linear-gradient(0deg, #0b1120 0%, transparent 100%); }
.eos-hero-content { position: relative; z-index: 2; max-width: 500px; }
.eos-hero-title { font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem; }
.eos-hero-meta { display: flex; gap: 1rem; font-size: 0.8rem; color: #94a3b8; margin-bottom: 1rem; }
.eos-rating-badge { background: #f59e0b; color: #0b1120; padding: 2px 6px; border-radius: 4px; font-weight: 800; }
.eos-hero-arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; background: rgba(0,0,0,0.5); border: none; color: white; border-radius: 50%; cursor: pointer; z-index: 5; }
.eos-hero-arrow.left { left: 20px; } .eos-hero-arrow.right { right: 20px; }
.eos-media-section { padding: 2rem 2rem 0; }
.eos-media-row { display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 1rem; }
.eos-media-card { min-width: 160px; max-width: 160px; transition: transform 0.3s; cursor: pointer; }
.eos-media-card:hover { transform: scale(1.05); }
.eos-card-poster { position: relative; aspect-ratio: 2/3; border-radius: 12px; overflow: hidden; background: #1e293b; }
.eos-card-poster img { width: 100%; height: 100%; object-fit: cover; }
.eos-card-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.3s; }
.eos-media-card:hover .eos-card-overlay { opacity: 1; }
.eos-new-badge { position: absolute; top: 8px; right: 8px; background: #22c55e; color: white; font-size: 0.6rem; padding: 2px 6px; border-radius: 4px; font-weight: 800; }
.eos-card-info { margin-top: 0.5rem; font-size: 0.85rem; }
.eos-card-title { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.eos-card-meta { color: #64748b; font-size: 0.75rem; }
.eos-media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1.5rem; }
.eos-music-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1.5rem; padding: 2rem; }
.eos-music-card { background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 12px; text-align: center; }
.eos-music-cover { aspect-ratio: 1; background: #1e293b; border-radius: 8px; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: center; }
.eos-admin-container { padding: 2rem; }
.admin-tabs { display: flex; gap: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 2rem; }
.admin-tabs button { padding: 0.5rem 1rem; background: none; border: none; color: #64748b; cursor: pointer; border-bottom: 2px solid transparent; }
.admin-tabs button.active { color: #f59e0b; border-bottom-color: #f59e0b; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
.stat-card { background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 12px; }
.stat-val { font-size: 1.5rem; font-weight: 800; }
.eos-scroll-table { overflow-x: auto; margin-top: 1rem; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 1rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.8rem; }
.type-badge { background: rgba(245, 158, 11, 0.1); color: #f59e0b; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; }
.table-btns { display: flex; gap: 4px; } .table-btns button { padding: 4px; border: none; border-radius: 4px; cursor: pointer; }
.eos-modal-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 100; }
.eos-modal { width: 90%; max-width: 600px; background: #111827; border-radius: 20px; overflow: hidden; position: relative; }
.eos-modal-banner { height: 250px; background-size: cover; display: flex; align-items: flex-end; padding: 2rem; position: relative; }
.eos-modal-body { padding: 2rem; } .eos-modal-desc { color: #94a3b8; font-size: 0.9rem; margin-bottom: 1.5rem; }
.eos-episodes-list { display: flex; flex-direction: column; gap: 8px; margin-top: 1rem; }
.eos-episode-item { display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 0.75rem; border-radius: 10px; cursor: pointer; }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.mt-4 { margin-top: 1rem; }
.mt-4 { margin-top: 1rem; }
.ml-auto { margin-left: auto; }

/* Folder Browser Modal */
.folder-browser-modal { max-width: 500px; height: 80vh; display: flex; flex-direction: column; }
.eos-modal-header-simple { padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
.eos-modal-header-simple h3 { font-size: 1rem; color: white; margin: 0; }
.eos-modal-close-small { background: none; border: none; color: #64748b; cursor: pointer; }
.browser-path-bar { padding: 0.75rem 1.5rem; background: rgba(0,0,0,0.2); font-size: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.03); display: flex; gap: 0.5rem; align-items: center; }
.path-label { color: #64748b; }
.path-value { color: #f59e0b; word-break: break-all; font-family: monospace; }
.browser-list { flex: 1; overflow-y: auto; padding: 0.5rem; display: flex; flex-direction: column; gap: 2px; }
.browser-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 8px; cursor: pointer; transition: all 0.2s; color: #cbd5e1; font-size: 0.85rem; }
.browser-item:hover { background: rgba(255,255,255,0.05); color: white; }
.browser-item.parent { color: #94a3b8; font-style: italic; }
.browser-loading, .browser-empty { display: flex; align-items: center; justify-content: center; height: 100px; color: #64748b; font-size: 0.85rem; }
.eos-modal-footer { padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: flex-end; gap: 1rem; }
.eos-btn-info { background: rgba(59, 130, 246, 0.1); color: #60a5fa; border: none; padding: 0.5rem; border-radius: 8px; cursor: pointer; }
.eos-btn-info:hover { background: #3b82f6; color: white; }

.spinning { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
