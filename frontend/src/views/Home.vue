<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import { Folder, Activity } from 'lucide-vue-next';

const auth = useAuthStore();
</script>

<template>
  <div class="home-view fade-in">
    <header class="top-bar">
      <h1>Buenos días, {{ auth.user?.username }}</h1>
      <div class="status-indicator">
        <span class="dot"></span> Sistema Online
      </div>
    </header>

    <section class="overview grid">
      <div class="card glass">
        <h3>Espacio usado</h3>
        <div class="stat">1.2 GB / 10 GB</div>
        <div class="progress-bar"><div class="fill" style="width: 12%"></div></div>
      </div>
      <div class="card glass">
        <h3>Apps activas</h3>
        <div class="stat">3 / 5</div>
      </div>
      <div class="card glass">
        <h3>Usuarios</h3>
        <div class="stat">1</div>
      </div>
    </section>

    <section class="quick-access">
      <h2>Acceso rápido</h2>
      <div class="app-grid">
        <router-link to="/files" class="app-item glass">
          <div class="app-icon purple"><Folder/></div>
          <span>Mis Archivos</span>
        </router-link>
        <div class="app-item glass">
          <div class="app-icon blue"><Activity/></div>
          <span>Monitor</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
}

.status-indicator {
  font-size: 0.85rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dot {
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 50%;
  box-shadow: 0 0 8px #22c55e;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.card {
  padding: 1.5rem;
}

.card h3 {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
}

.stat {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.progress-bar {
  height: 6px;
  background: #334155;
  border-radius: 3px;
  overflow: hidden;
}

.fill {
  height: 100%;
  background: var(--primary);
}

.quick-access h2 {
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1.5rem;
}

.app-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  gap: 1rem;
  cursor: pointer;
  transition: transform 0.2s;
  text-decoration: none;
  color: inherit;
}

.app-item:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.05);
}

.app-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.app-icon.purple { background: linear-gradient(135deg, #a855f7, #6366f1); }
.app-icon.blue { background: linear-gradient(135deg, #3b82f6, #06b6d4); }
</style>
