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
        <button class="eos-nav-item" @click="showSettings = !showSettings">
          <Settings2 :size="20" />
          <span>Ajustes</span>
        </button>
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

      <!-- Scrollable Content -->
      <div class="eos-content" ref="contentRef">

        <!-- Hero Carousel -->
        <section class="eos-hero" v-if="activeNav === 'home'">
          <div class="eos-hero-slider" :style="{ transform: `translateX(-${heroIndex * 100}%)` }">
            <div
              v-for="(item, i) in heroItems"
              :key="i"
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
                  <button class="eos-btn-primary" @click="playMedia(heroItems[heroIndex])">
                    <Play :size="18" /> Reproducir
                  </button>
                  <button class="eos-btn-secondary" @click="openMediaDetail(heroItems[heroIndex])">
                    <Info :size="18" /> Más Info
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button class="eos-hero-arrow left" @click="prevHero"><ChevronLeft :size="28" /></button>
          <button class="eos-hero-arrow right" @click="nextHero"><ChevronRight :size="28" /></button>
          <div class="eos-hero-dots">
            <span
              v-for="(_, i) in heroItems"
              :key="i"
              class="eos-dot"
              :class="{ active: heroIndex === i }"
              @click="heroIndex = i"
            ></span>
          </div>
          <!-- Progress bar -->
          <div class="eos-hero-progress">
            <div class="eos-hero-progress-fill" :style="{ width: heroProgress + '%' }"></div>
          </div>
        </section>

        <!-- Media Rows -->
        <template v-if="activeNav === 'home'">
          <section class="eos-media-section" v-for="section in mediaSections" :key="section.title">
            <div class="eos-section-header">
              <h2>{{ section.title }}</h2>
              <button class="eos-see-all">Ver todo <ChevronRight :size="14" /></button>
            </div>
            <div class="eos-media-row">
              <div
                v-for="(media, i) in section.items"
                :key="i"
                class="eos-media-card"
                @click="openMediaDetail(media)"
              >
                <div class="eos-card-poster">
                  <img :src="media.poster" :alt="media.title" loading="lazy" />
                  <div class="eos-card-overlay">
                    <button class="eos-play-btn"><Play :size="24" /></button>
                  </div>
                  <span v-if="media.isNew" class="eos-new-badge">NEW</span>
                  <div v-if="media.progress" class="eos-card-progress">
                    <div class="eos-card-progress-fill" :style="{ width: media.progress + '%' }"></div>
                  </div>
                </div>
                <div class="eos-card-info">
                  <div class="eos-card-title">{{ media.title }}</div>
                  <div class="eos-card-meta">{{ media.year }} · {{ media.genre }}</div>
                </div>
              </div>
            </div>
          </section>
        </template>

        <!-- Movies View -->
        <template v-if="activeNav === 'movies'">
          <section class="eos-grid-section">
            <h2 class="eos-page-title">Películas</h2>
            <div class="eos-filter-bar">
              <button
                v-for="genre in genres"
                :key="genre"
                class="eos-filter-chip"
                :class="{ active: activeGenre === genre }"
                @click="activeGenre = genre"
              >{{ genre }}</button>
            </div>
            <div class="eos-media-grid">
              <div
                v-for="(media, i) in allMedia"
                :key="i"
                class="eos-media-card"
                @click="openMediaDetail(media)"
              >
                <div class="eos-card-poster">
                  <img :src="media.poster" :alt="media.title" loading="lazy" />
                  <div class="eos-card-overlay">
                    <button class="eos-play-btn"><Play :size="24" /></button>
                  </div>
                  <span v-if="media.isNew" class="eos-new-badge">NEW</span>
                </div>
                <div class="eos-card-info">
                  <div class="eos-card-title">{{ media.title }}</div>
                  <div class="eos-card-meta">{{ media.year }} · {{ media.genre }}</div>
                </div>
              </div>
            </div>
          </section>
        </template>

        <!-- Series View -->
        <template v-if="activeNav === 'series'">
          <section class="eos-grid-section">
            <h2 class="eos-page-title">Series</h2>
            <div class="eos-media-grid">
              <div
                v-for="(media, i) in seriesMedia"
                :key="i"
                class="eos-media-card"
                @click="openMediaDetail(media)"
              >
                <div class="eos-card-poster">
                  <img :src="media.poster" :alt="media.title" loading="lazy" />
                  <div class="eos-card-overlay">
                    <button class="eos-play-btn"><Play :size="24" /></button>
                  </div>
                  <span class="eos-new-badge">SERIE</span>
                </div>
                <div class="eos-card-info">
                  <div class="eos-card-title">{{ media.title }}</div>
                  <div class="eos-card-meta">{{ media.year }} · {{ media.genre }}</div>
                </div>
              </div>
            </div>
          </section>
        </template>

        <!-- Music View -->
        <template v-if="activeNav === 'music'">
          <section class="eos-grid-section">
            <h2 class="eos-page-title">Música</h2>
            <div class="eos-music-grid">
              <div v-for="(track, i) in musicTracks" :key="i" class="eos-music-card">
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
          </section>
        </template>

      </div>

      <!-- Settings / Admin Modal -->
      <Transition name="modal-fade">
        <div v-if="showSettings" class="eos-modal-overlay" @click.self="showSettings = false">
          <div class="eos-modal settings-modal">
            <header class="eos-modal-banner settings-header">
              <div class="eos-modal-banner-content">
                <h2>Ajustes de EntertainmentOS</h2>
                <p>Configura tus librerías y escanea contenido</p>
              </div>
              <button class="eos-modal-close" @click="showSettings = false"><X :size="20" /></button>
            </header>
            
            <div class="eos-modal-body">
              <div class="settings-section">
                <h3><FolderPlus :size="16" /> Gestionar Librerías</h3>
                <p class="section-desc">Añade carpetas locales de NubeOS para escanear películas y series.</p>
                
                <div class="lib-add-form">
                  <input v-model="newLibPath" type="text" placeholder="Ruta de la carpeta (ej: C:/Peliculas)" />
                  <button @click="addLibrary" class="eos-btn-primary">Añadir</button>
                </div>

                <div class="lib-list">
                  <div v-for="lib in libraries" :key="lib.id" class="lib-item">
                    <div class="lib-info">
                      <div class="lib-name">{{ lib.name }}</div>
                      <div class="lib-path">{{ lib.path }}</div>
                    </div>
                    <button @click="removeLibrary(lib.id)" class="lib-remove-btn"><Trash2 :size="14" /></button>
                  </div>
                  <div v-if="libraries.length === 0" class="lib-empty">No hay librerías configuradas.</div>
                </div>
              </div>

              <div class="settings-divider"></div>

              <div class="settings-section">
                <h3><RefreshCw :size="16" /> Escaneo de Contenido</h3>
                <p class="section-desc">Busca nuevos archivos en todas las librerías configuradas.</p>
                <button @click="scanLibraries" class="eos-btn-secondary" :disabled="scanning">
                  <Loader2 v-if="scanning" class="spinning" :size="16" />
                  <span v-else>Escanear Librerías</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
  Share2, Star, RefreshCw, FolderPlus, Trash2, Loader2
} from 'lucide-vue-next';
import axios from 'axios';
import { useDesktopStore } from '../stores/desktop';
import { useNotificationStore } from '../stores/notification';

const desktop = useDesktopStore();
const notification = useNotificationStore();

// --- Navigation ---
const activeNav = ref('home');
const navItems = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'movies', label: 'Películas', icon: Film },
  { id: 'series', label: 'Series', icon: Tv },
  { id: 'music', label: 'Música', icon: Music },
];

// --- Hero Carousel ---
const heroIndex = ref(0);
const heroProgress = ref(0);
let heroTimer: any = null;
let progressTimer: any = null;

const heroItems = [
  {
    title: 'Stellar Horizon',
    rating: 'PG-13',
    duration: '2h 46m',
    genre: 'Sci-Fi',
    year: '2026',
    description: 'En los confines del espacio conocido, una tripulación se enfrenta a lo desconocido mientras busca el origen de una señal que podría cambiar el destino de la humanidad.',
    banner: '/entertainment/posters/hero_banner.png'
  },
  {
    title: 'Shadow Protocol',
    rating: 'R',
    duration: '2h 10m',
    genre: 'Thriller',
    year: '2026',
    description: 'Un agente encubierto descubre una conspiración global que amenaza con desestabilizar el orden mundial. La línea entre aliado y enemigo se vuelve invisible.',
    banner: '/entertainment/posters/hero_banner_2.png'
  },
  {
    title: 'Crimson Dynasty',
    rating: 'PG-13',
    duration: '2h 35m',
    genre: 'Fantasía',
    year: '2025',
    description: 'Una reina guerrera debe reclamar su trono perdido mientras enfrenta las fuerzas oscuras que amenazan con destruir todo lo que conoce.',
    banner: '/entertainment/posters/crimson_dynasty.png'
  }
];

const startHeroAutoplay = () => {
  clearInterval(heroTimer);
  clearInterval(progressTimer);
  heroProgress.value = 0;
  const SLIDE_DURATION = 8000;
  const TICK = 50;
  progressTimer = setInterval(() => {
    heroProgress.value += (TICK / SLIDE_DURATION) * 100;
    if (heroProgress.value >= 100) heroProgress.value = 100;
  }, TICK);
  heroTimer = setInterval(() => {
    heroIndex.value = (heroIndex.value + 1) % heroItems.length;
    heroProgress.value = 0;
  }, SLIDE_DURATION);
};

const nextHero = () => {
  heroIndex.value = (heroIndex.value + 1) % heroItems.length;
  heroProgress.value = 0;
  startHeroAutoplay();
};

const prevHero = () => {
  heroIndex.value = (heroIndex.value - 1 + heroItems.length) % heroItems.length;
  heroProgress.value = 0;
  startHeroAutoplay();
};

// --- Media Data ---
const allMedia = ref<any[]>([]);
const loading = ref(false);

const fetchCatalog = async () => {
  loading.value = true;
  try {
    const res = await axios.get('/api/entertainment/catalog');
    allMedia.value = res.data.map((m: any) => ({
      ...m,
      stars: m.stars || 5,
      isNew: m.is_new === 1,
      poster: m.poster_path ? `/api/entertainment/poster/${m.id}` : '/entertainment/posters/stellar_horizon.png',
      banner: m.banner_path || '/entertainment/posters/hero_banner.png',
      progress: m.progress ? (m.progress / 7200) * 100 : 0
    }));
  } catch (err) {
    console.error('Error fetching catalog:', err);
  } finally {
    loading.value = false;
  }
};

const libraries = ref<any[]>([]);
const newLibPath = ref('');
const fetchLibraries = async () => {
  try {
    const res = await axios.get('/api/entertainment/admin/libraries');
    libraries.value = res.data;
  } catch (err) { /* ignore if not admin */ }
};

const addLibrary = async () => {
  if (!newLibPath.value) return;
  try {
    await axios.post('/api/entertainment/admin/libraries', {
      path: newLibPath.value,
      name: newLibPath.value.split('/').pop() || 'Nueva Librería'
    });
    newLibPath.value = '';
    fetchLibraries();
    notification.success('Éxito', 'Librería añadida correctamente');
  } catch (err) {
    notification.error('Error', 'No se pudo añadir la librería');
  }
};

const playMedia = (media: any) => {
  if (!media.file_path) {
    notification.error('Error', 'Este elemento no tiene un archivo de video asociado.');
    return;
  }
  desktop.playVideo(media.file_path, media.title);
  selectedMedia.value = null;
};


const seriesMedia = computed(() => [
  { title: 'Código Neural', poster: '/entertainment/posters/neon_vengeance.png', year: '2025', genre: 'Sci-Fi', stars: 5 },
  { title: 'El Último Legado', poster: '/entertainment/posters/crimson_dynasty.png', year: '2026', genre: 'Drama', stars: 4 },
  { title: 'Cazadores de Sombras', poster: '/entertainment/posters/shadow_protocol.png', year: '2024', genre: 'Acción', stars: 4 },
  { title: 'Onda Profunda', poster: '/entertainment/posters/abyss_below.png', year: '2025', genre: 'Terror', stars: 3 },
  { title: 'Travesía Estelar', poster: '/entertainment/posters/stellar_horizon.png', year: '2026', genre: 'Sci-Fi', stars: 5 },
  { title: 'Ecos del Pasado', poster: '/entertainment/posters/echo_chamber.png', year: '2025', genre: 'Misterio', stars: 4 },
]);

const scanning = ref(false);
const scanLibraries = async () => {
  scanning.value = true;
  try {
    const res = await axios.post('/api/entertainment/admin/scan');
    notification.success('Escaneo Finalizado', `${res.data.newItems} nuevos elementos encontrados.`);
    fetchCatalog();
  } catch (err) {
    notification.error('Error', 'No se pudo realizar el escaneo');
  } finally {
    scanning.value = false;
  }
};

const mediaSections = computed(() => [
  {
    title: 'Seguir Viendo',
    items: allMedia.value.filter(m => m.progress > 0)
  },
  {
    title: 'Agregados Recientemente',
    items: allMedia.value.filter(m => m.isNew)
  },
  {
    title: 'Vistos Recientemente',
    items: [...allMedia.value].reverse().slice(0, 6)
  },
  {
    title: 'Top Valoradas',
    items: [...allMedia.value].sort((a, b) => (b.stars || 0) - (a.stars || 0)).slice(0, 6)
  }
]);

const musicTracks = ref([
  { title: 'Nebulosa', artist: 'Astral Waves', color: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { title: 'Noctámbulo', artist: 'Midnight Pulse', color: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { title: 'Aurora Boreal', artist: 'Arctic Echoes', color: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  { title: 'Pulso Oscuro', artist: 'Dark Matter', color: 'linear-gradient(135deg, #0c3483, #a2b6df)' },
  { title: 'Cristal Roto', artist: 'Shattered Glass', color: 'linear-gradient(135deg, #fa709a, #fee140)' },
  { title: 'Horizonte', artist: 'Solar Drift', color: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
  { title: 'Eco Silente', artist: 'Void Walker', color: 'linear-gradient(135deg, #30cfd0, #330867)' },
  { title: 'Supernova', artist: 'Cosmic Dust', color: 'linear-gradient(135deg, #e8198b, #c7eafd)' },
]);
};

const removeLibrary = async (id: number) => {
  if (!confirm('¿Seguro que deseas eliminar esta librería? No se borrarán los archivos, solo el acceso.')) return;
  try {
    await axios.delete(`/api/entertainment/admin/libraries/${id}`);
    fetchLibraries();
    notification.success('Eliminado', 'Librería eliminada');
  } catch (err) {
    notification.error('Error', 'No se pudo eliminar la librería');
  }
};


// --- Genres Filter ---
const genres = ['Todas', 'Sci-Fi', 'Thriller', 'Acción', 'Terror', 'Fantasía', 'Western', 'Psicológico'];
const activeGenre = ref('Todas');

// --- Search ---
const searchQuery = ref('');

// --- Modal ---
const selectedMedia = ref<any>(null);
const showSettings = ref(false);
const contentRef = ref<HTMLElement | null>(null);

const openMediaDetail = (media: any) => {
  selectedMedia.value = media;
};

// --- Lifecycle ---
onMounted(() => {
  startHeroAutoplay();
  fetchCatalog();
  fetchLibraries();
});

onUnmounted(() => {
  clearInterval(heroTimer);
  clearInterval(progressTimer);
});
</script>

<style scoped>
/* ===== ROOT ===== */
.eos-container {
  display: flex;
  width: 100%;
  height: 100%;
  background: #0b1120;
  color: #e2e8f0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  overflow: hidden;
}

/* ===== SIDEBAR ===== */
.eos-sidebar {
  width: 68px;
  min-width: 68px;
  background: rgba(8, 15, 30, 0.95);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0;
  gap: 0.5rem;
  backdrop-filter: blur(10px);
  z-index: 10;
}

.eos-sidebar-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  color: #f59e0b;
  margin-bottom: 1.5rem;
  cursor: pointer;
}

.eos-sidebar-logo span {
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  opacity: 0.7;
}

.eos-sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.eos-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.65rem 0.5rem;
  border-radius: 12px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.25s ease;
  background: transparent;
  border: none;
  font-size: 0.6rem;
  font-weight: 500;
  width: 56px;
}

.eos-nav-item:hover {
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.05);
}

.eos-nav-item.active {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  box-shadow: inset 3px 0 0 #f59e0b;
  border-radius: 0 12px 12px 0;
}

.eos-sidebar-footer {
  margin-top: auto;
}

/* ===== MAIN ===== */
.eos-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== TOP BAR ===== */
.eos-topbar {
  height: 56px;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  background: rgba(11, 17, 32, 0.8);
  backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  z-index: 5;
}

.eos-search-box {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 0.5rem 1rem;
  width: 340px;
  transition: all 0.3s ease;
  color: #64748b;
}

.eos-search-box:focus-within {
  border-color: rgba(245, 158, 11, 0.4);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.08);
}

.eos-search-box input {
  background: none;
  border: none;
  outline: none;
  color: #e2e8f0;
  font-size: 0.85rem;
  width: 100%;
}

.eos-search-box input::placeholder {
  color: #475569;
}

.eos-topbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.eos-icon-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}

.eos-icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.eos-badge {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 16px;
  height: 16px;
  background: #ef4444;
  border-radius: 50%;
  font-size: 0.6rem;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.eos-user-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem 0.35rem 0.35rem;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
}

.eos-user-pill:hover {
  background: rgba(255, 255, 255, 0.1);
}

.eos-user-avatar {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

/* ===== CONTENT SCROLL ===== */
.eos-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
}

.eos-content::-webkit-scrollbar {
  width: 6px;
}

.eos-content::-webkit-scrollbar-track {
  background: transparent;
}

.eos-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

/* ===== HERO CAROUSEL ===== */
.eos-hero {
  position: relative;
  width: 100%;
  height: 420px;
  overflow: hidden;
  border-radius: 0 0 0 0;
}

.eos-hero-slider {
  display: flex;
  height: 100%;
  transition: transform 0.7s cubic-bezier(0.65, 0, 0.35, 1);
}

.eos-hero-slide {
  min-width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center top;
  position: relative;
  display: flex;
  align-items: flex-end;
}

.eos-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, #0b1120 0%, rgba(11, 17, 32, 0.6) 40%, rgba(11, 17, 32, 0.2) 100%);
}

.eos-hero-content {
  position: relative;
  z-index: 2;
  padding: 2.5rem;
  max-width: 600px;
}

.eos-hero-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: white;
  margin-bottom: 0.75rem;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  letter-spacing: -0.02em;
}

.eos-hero-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
  color: #94a3b8;
  margin-bottom: 0.75rem;
}

.eos-rating-badge {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.75rem;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.eos-hero-desc {
  font-size: 0.9rem;
  color: #94a3b8;
  line-height: 1.5;
  margin-bottom: 1.25rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.eos-hero-actions {
  display: flex;
  gap: 0.75rem;
}

.eos-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.5rem;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #0b1120;
  font-weight: 700;
  font-size: 0.9rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
}

.eos-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(245, 158, 11, 0.45);
}

.eos-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s ease;
  backdrop-filter: blur(8px);
}

.eos-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.18);
  transform: translateY(-2px);
}

.eos-btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}

.eos-btn-icon:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.eos-hero-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  transition: all 0.3s ease;
  backdrop-filter: blur(6px);
  opacity: 0;
}

.eos-hero:hover .eos-hero-arrow {
  opacity: 1;
}

.eos-hero-arrow:hover {
  background: rgba(245, 158, 11, 0.3);
  border-color: rgba(245, 158, 11, 0.5);
  transform: translateY(-50%) scale(1.1);
}

.eos-hero-arrow.left { left: 16px; }
.eos-hero-arrow.right { right: 16px; }

.eos-hero-dots {
  position: absolute;
  bottom: 50px;
  right: 2.5rem;
  display: flex;
  gap: 8px;
  z-index: 3;
}

.eos-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.eos-dot.active {
  background: #f59e0b;
  width: 24px;
  border-radius: 4px;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
}

.eos-hero-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.08);
  z-index: 3;
}

.eos-hero-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
  transition: width 0.05s linear;
  border-radius: 0 2px 2px 0;
}

/* ===== MEDIA SECTIONS ===== */
.eos-media-section {
  padding: 1.75rem 2rem 0.5rem;
}

.eos-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.eos-section-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
}

.eos-see-all {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 500;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
}

.eos-see-all:hover {
  color: #f59e0b;
}

/* ===== MEDIA ROW (Horizontal Scroll) ===== */
.eos-media-row {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 1rem;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}

.eos-media-row::-webkit-scrollbar {
  height: 4px;
}

.eos-media-row::-webkit-scrollbar-track {
  background: transparent;
}

.eos-media-row::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
}

/* ===== MEDIA CARD ===== */
.eos-media-card {
  min-width: 165px;
  max-width: 165px;
  cursor: pointer;
  scroll-snap-align: start;
  transition: transform 0.3s ease;
}

.eos-media-card:hover {
  transform: translateY(-6px);
}

.eos-card-poster {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: 12px;
  overflow: hidden;
  background: #1e293b;
}

.eos-card-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.eos-media-card:hover .eos-card-poster img {
  transform: scale(1.05);
}

.eos-card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.eos-media-card:hover .eos-card-overlay {
  opacity: 1;
}

.eos-play-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(245, 158, 11, 0.9);
  border: none;
  color: #0b1120;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
}

.eos-play-btn:hover {
  transform: scale(1.15);
}

.eos-new-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  font-size: 0.6rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  letter-spacing: 0.05em;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
}

.eos-card-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
}

.eos-card-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
  border-radius: 0 2px 2px 0;
}

.eos-card-info {
  padding: 0.65rem 0.25rem 0;
}

.eos-card-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.eos-card-meta {
  font-size: 0.72rem;
  color: #64748b;
  margin-top: 0.2rem;
}

/* ===== GRID SECTION (Movies/Series) ===== */
.eos-grid-section {
  padding: 2rem;
}

.eos-page-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: white;
  margin-bottom: 1.25rem;
}

.eos-filter-bar {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.eos-filter-chip {
  padding: 0.4rem 1rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
}

.eos-filter-chip:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.eos-filter-chip.active {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.2));
  border-color: rgba(245, 158, 11, 0.4);
  color: #f59e0b;
}

.eos-media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(155px, 1fr));
  gap: 1.25rem;
}

.eos-media-grid .eos-media-card {
  min-width: unset;
  max-width: unset;
}

/* ===== MUSIC GRID ===== */
.eos-music-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1.25rem;
}

.eos-music-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.eos-music-card:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.eos-music-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.eos-music-cover-art {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
}

.eos-music-play-overlay {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f59e0b;
  color: #0b1120;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.eos-music-card:hover .eos-music-play-overlay {
  opacity: 1;
  transform: translateY(0);
}

.eos-music-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.eos-music-artist {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.15rem;
}

/* ===== MODAL ===== */
.eos-modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.eos-modal {
  width: 90%;
  max-width: 600px;
  max-height: 85%;
  background: #111827;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
}

.eos-modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  transition: all 0.2s;
}

.eos-modal-close:hover {
  background: rgba(239, 68, 68, 0.6);
}

.eos-modal-banner {
  position: relative;
  width: 100%;
  height: 220px;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-end;
}

.eos-modal-banner-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, #111827 0%, rgba(17, 24, 39, 0.5) 50%, transparent 100%);
}

.eos-modal-banner-content {
  position: relative;
  z-index: 2;
  padding: 1.5rem;
}

.eos-modal-banner-content h2 {
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
  margin-bottom: 0.5rem;
}

.eos-modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.eos-modal-desc {
  color: #94a3b8;
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: 1.25rem;
}

.eos-modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.eos-modal-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.eos-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.eos-detail-label {
  color: #64748b;
  font-weight: 500;
}

.eos-stars {
  display: flex;
  gap: 2px;
  color: #334155;
}

.eos-stars .filled {
  color: #f59e0b;
}

/* ===== SETTINGS MODAL ===== */
.settings-modal {
  max-width: 500px;
}

.settings-header {
  height: 140px;
  background: linear-gradient(135deg, #1e293b, #0f172a);
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.settings-section h3 {
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
}

.section-desc {
  font-size: 0.8rem;
  color: #64748b;
}

.lib-add-form {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.lib-add-form input {
  flex: 1;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  color: white;
  font-size: 0.85rem;
}

.lib-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.lib-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px;
}

.lib-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #e2e8f0;
}

.lib-path {
  font-size: 0.7rem;
  color: #64748b;
  margin-top: 0.1rem;
}

.lib-remove-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.lib-remove-btn:hover {
  background: #ef4444;
  color: white;
}

.lib-empty {
  text-align: center;
  padding: 2rem;
  font-size: 0.8rem;
  color: #475569;
  border: 2px dashed rgba(255,255,255,0.05);
  border-radius: 12px;
}

.settings-divider {
  height: 1px;
  background: rgba(255,255,255,0.05);
  margin: 1.5rem 0;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
