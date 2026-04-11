<script setup lang="ts">
import { useDesktopStore } from '../stores/desktop';
import { Palette, Image as ImageIcon, Monitor } from 'lucide-vue-next';

const desktop = useDesktopStore();

const wallpapers = [
  { name: 'Abstract Blue', url: '/wallpapers/wp0.png' },
  { name: 'Dark Nature', url: '/wallpapers/wp1.png' },
  { name: 'Fluid Waves', url: '/wallpapers/wp2.png' },
];

const changeWallpaper = (url: string) => {
  desktop.setWallpaper(url);
};
</script>

<template>
  <div class="settings-view fade-in">
    <header class="section-header">
      <div class="title-group">
        <h1>Configuración</h1>
        <p>Personaliza tu experiencia en NubeOS.</p>
      </div>
    </header>

    <div class="settings-grid">
      <!-- Appearance Section -->
      <section class="settings-card glass">
        <div class="card-header">
          <Palette :size="20" class="icon-primary"/>
          <h3>Apariencia</h3>
        </div>

        <div class="setting-item">
          <label><ImageIcon :size="16"/> Fondo de Pantalla</label>
          <div class="wallpaper-selector">
            <div 
              v-for="wp in wallpapers" 
              :key="wp.url"
              class="wp-thumb"
              :class="{ active: desktop.wallpaper === wp.url }"
              @click="changeWallpaper(wp.url)"
              :style="{ backgroundImage: `url(${wp.url})` }"
            >
              <div class="wp-label">{{ wp.name }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- System Section -->
      <section class="settings-card glass">
        <div class="card-header">
          <Monitor :size="20" class="icon-primary"/>
          <h3>Escritorio</h3>
        </div>
        <div class="setting-item">
          <p>Ajustes avanzados de la interfaz y efectos visuales.</p>
          <button class="btn-secondary" disabled>Próximamente</button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section-header h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
.section-header p { color: var(--text-muted); font-size: 0.85rem; }

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.settings-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 700;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.icon-primary { color: var(--primary); }

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-item label {
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-muted);
}

.wallpaper-selector {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
}

.wp-thumb {
  height: 100px;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.wp-thumb:hover { transform: scale(1.02); }
.wp-thumb.active { border-color: var(--primary); box-shadow: 0 0 10px rgba(99, 102, 241, 0.4); }

.wp-label {
  position: absolute;
  bottom: 0; left: 0; right:0;
  background: rgba(0,0,0,0.6);
  padding: 0.25rem;
  font-size: 0.7rem;
  text-align: center;
}

.btn-secondary {
  padding: 0.6rem;
  font-size: 0.8rem;
  background: rgba(255,255,255,0.05);
  color: var(--text-muted);
}
</style>
