<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useFileStore } from '../stores/files';
import { 
  Folder, 
  File, 
  MoreVertical, 
  Upload, 
  Plus, 
  Trash2, 
  ChevronLeft,
  Search,
  Grid,
  List
} from 'lucide-vue-next';

const fileStore = useFileStore();
const selectedItems = ref<string[]>([]);
const viewMode = ref<'grid' | 'list'>('grid');

onMounted(() => {
  fileStore.fetchFiles();
});

const navigateTo = (folderName: string) => {
  const newPath = fileStore.currentPath ? `${fileStore.currentPath}/${folderName}` : folderName;
  fileStore.fetchFiles(newPath);
  selectedItems.value = [];
};

const goBack = () => {
  const parts = fileStore.currentPath.split('/');
  parts.pop();
  fileStore.fetchFiles(parts.join('/'));
  selectedItems.value = [];
};

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    fileStore.uploadFiles(target.files);
  }
};

const triggerUpload = () => {
  const input = document.getElementById('file-upload') as HTMLInputElement;
  input.click();
};

const createFolder = () => {
  const name = prompt('Nombre de la carpeta:');
  if (name) fileStore.createFolder(name);
};

const deleteSelected = () => {
  if (selectedItems.value.length === 0) return;
  if (confirm(`¿Eliminar ${selectedItems.value.length} elementos?`)) {
    fileStore.deleteItems(selectedItems.value);
    selectedItems.value = [];
  }
};

const toggleSelect = (name: string) => {
  const index = selectedItems.value.indexOf(name);
  if (index > -1) {
    selectedItems.value.splice(index, 1);
  } else {
    selectedItems.value.push(name);
  }
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>

<template>
  <div class="files-view fade-in">
    <header class="files-header">
      <div class="breadcrumb">
        <button v-if="fileStore.currentPath" @click="goBack" class="back-btn">
          <ChevronLeft :size="20"/>
        </button>
        <span class="path">Archivos / {{ fileStore.currentPath }}</span>
      </div>

      <div class="actions">
        <!-- Hidden Upload Input -->
        <input 
          id="file-upload" 
          type="file" 
          multiple 
          style="display: none" 
          @change="handleFileUpload"
        />
        
        <button @click="triggerUpload" class="btn btn-secondary">
          <Upload :size="18"/> <span>Subir</span>
        </button>
        <button @click="createFolder" class="btn btn-secondary">
          <Plus :size="18"/> <span>Nueva Carpeta</span>
        </button>
        <button 
          v-if="selectedItems.length > 0" 
          @click="deleteSelected" 
          class="btn btn-danger"
        >
          <Trash2 :size="18"/> <span>Eliminar ({{ selectedItems.length }})</span>
        </button>

        <div class="view-toggle">
          <button @click="viewMode = 'grid'" :class="{ active: viewMode === 'grid' }"><Grid :size="18"/></button>
          <button @click="viewMode = 'list'" :class="{ active: viewMode === 'list' }"><List :size="18"/></button>
        </div>
      </div>
    </header>

    <div v-if="fileStore.loading" class="loader">
      <div class="spinner"></div>
      Cargando archivos...
    </div>

    <div v-else class="file-area" :class="viewMode">
      <div 
        v-for="item in fileStore.items" 
        :key="item.name"
        class="file-item glass"
        :class="{ selected: selectedItems.includes(item.name) }"
        @click="toggleSelect(item.name)"
        @dblclick="item.isDirectory ? navigateTo(item.name) : null"
      >
        <div class="icon">
          <Folder v-if="item.isDirectory" :size="48" color="#6366f1" fill="#6366f122" />
          <File v-else :size="48" color="#cbd5e1" />
        </div>
        <div class="info">
          <span class="name">{{ item.name }}</span>
          <span class="meta" v-if="!item.isDirectory">{{ formatSize(item.size) }}</span>
        </div>
        <button class="more-btn"><MoreVertical :size="16"/></button>
      </div>

      <div v-if="fileStore.items.length === 0" class="empty-state">
        <Folder :size="64" color="#334155" />
        <p>Esta carpeta está vacía</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.files-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-btn {
  background: rgba(255, 255, 255, 0.05);
  padding: 0.5rem;
}

.path {
  font-weight: 600;
  color: var(--text-muted);
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  font-size: 0.85rem;
}

.btn-secondary { background: rgba(255, 255, 255, 0.05); color: white; border: 1px solid var(--border); }
.btn-danger { background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); }

.view-toggle {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius);
  padding: 2px;
}

.view-toggle button {
  padding: 0.5rem;
  background: transparent;
  color: var(--text-muted);
}

.view-toggle button.active {
  background: var(--primary);
  color: white;
}

.file-area {
  display: grid;
  gap: 1.5rem;
}

.file-area.grid {
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
}

.file-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.file-item:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
}

.file-item.selected {
  border-color: var(--primary);
  background: rgba(99, 102, 241, 0.1);
}

.file-item .info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  width: 100%;
}

.name {
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.meta {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.more-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: transparent;
  color: var(--text-muted);
  opacity: 0;
}

.file-item:hover .more-btn { opacity: 1; }

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem;
  gap: 1.5rem;
  color: var(--text-muted);
}

/* Loader */
.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 5rem;
  color: var(--text-muted);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
