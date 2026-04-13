<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick, computed, watch } from 'vue';
import { useFileStore } from '../stores/files';
import type { FileItem } from '../stores/files';
import { 
  Folder, File, FileText, FileImage, FileVideo, 
  Upload, Plus, Trash2, ChevronRight, Grid, List, 
  Download, X, Copy, Scissors, Edit2, Info, ClipboardPaste,
  Search, ArrowLeft, ArrowRight, Layout, 
  ChevronDown, HardDrive, Clock, Star,
  FileSearch, Table, SortAsc, RotateCcw
} from 'lucide-vue-next';

const fileStore = useFileStore();
const selectedItems = ref<string[]>([]);
const viewMode = ref<'grid' | 'list' | 'details'>('grid');
const showSidebar = ref(true);
const showInfoPanel = ref(false);
const searchQuery = ref('');

// UI States
const contextMenu = ref({ visible: false, x: 0, y: 0, item: null as FileItem | null });
const renamingItem = ref<FileItem | null>(null);
const newNameValue = ref('');
const renameInput = ref<HTMLInputElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);

// Selection state
const lastSelectedIndex = ref(-1);
const selectedItem = ref<FileItem | null>(null);

// External Drives State
const externalDrives = ref<any[]>([]);
const fetchDrives = async () => {
  try {
    const res = await axios.get('/api/system/external-drives');
    externalDrives.value = res.data;
  } catch (err) {
    console.error('Error fetching drives for sidebar');
  }
};

onMounted(async () => {
  await fileStore.fetchFiles();
  await fileStore.fetchFolderTree();
  fetchDrives();
  window.addEventListener('click', closeContextMenu);
  window.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener('click', closeContextMenu);
  window.removeEventListener('keydown', handleGlobalKeydown);
});

// --- Navigation ---
const navigateTo = (path: string) => {
  fileStore.navigateToPath(path);
  selectedItems.value = [];
};

const goBack = () => {
  fileStore.goBack();
  selectedItems.value = [];
};

const goForward = () => {
  fileStore.goForward();
  selectedItems.value = [];
};

// --- Selection Logic ---
const toggleSelect = (item: FileItem, event?: MouseEvent) => {
  if (event?.ctrlKey || event?.metaKey) {
    const index = selectedItems.value.indexOf(item.name);
    if (index > -1) selectedItems.value.splice(index, 1);
    else selectedItems.value.push(item.name);
  } else if (event?.shiftKey && lastSelectedIndex.value !== -1) {
    const items = fileStore.sortedItems;
    const currentIdx = items.findIndex(i => i.name === item.name);
    const start = Math.min(lastSelectedIndex.value, currentIdx);
    const end = Math.max(lastSelectedIndex.value, currentIdx);
    
    const newSelection = items.slice(start, end + 1).map(i => i.name);
    // Add unique only
    newSelection.forEach(name => {
      if (!selectedItems.value.includes(name)) selectedItems.value.push(name);
    });
  } else {
    selectedItems.value = [item.name];
  }
  
  lastSelectedIndex.value = fileStore.sortedItems.findIndex(i => i.name === item.name);
};

const selectAll = () => {
  selectedItems.value = fileStore.sortedItems.map(i => i.name);
};

const clearSelection = (e: MouseEvent) => {
  if ((e.target as HTMLElement).classList.contains('file-area-inner')) {
    selectedItems.value = [];
    lastSelectedIndex.value = -1;
  }
};

// --- Actions ---
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    fileStore.uploadFiles(target.files);
    target.value = '';
  }
};

const triggerUpload = () => {
  document.getElementById('file-upload-main')?.click();
};

const createFolder = () => {
  const name = prompt('Nombre de la carpeta:');
  if (name) fileStore.createFolder(name);
};

const deleteSelected = () => {
  if (selectedItems.value.length === 0) return;
  const msg = selectedItems.value.length === 1 
    ? `¿Eliminar "${selectedItems.value[0]}"?` 
    : `¿Eliminar ${selectedItems.value.length} elementos?`;
    
  if (confirm(msg)) {
    fileStore.deleteItems(selectedItems.value);
    selectedItems.value = [];
  }
};

const startRename = (item: FileItem) => {
  renamingItem.value = item;
  newNameValue.value = item.name;
  nextTick(() => {
    if (renameInput.value) {
      renameInput.value.focus();
      if (!item.isDirectory && item.name.includes('.')) {
        const dotIndex = item.name.lastIndexOf('.');
        renameInput.value.setSelectionRange(0, dotIndex);
      } else {
        renameInput.value.select();
      }
    }
  });
};

const confirmRename = async () => {
  if (!renamingItem.value) return;
  const oldName = renamingItem.value.name;
  const newName = newNameValue.value.trim();
  if (newName && newName !== oldName) {
    await fileStore.renameItem(oldName, newName);
  }
  renamingItem.value = null;
};

// --- Search ---
watch(searchQuery, (newVal) => {
  fileStore.searchFiles(newVal);
});

// --- Helpers ---
const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
const videoExts = ['.mp4', '.webm', '.ogg', '.mov', '.mkv'];
const audioExts = ['.mp3', '.wav', '.flac', '.aac', '.m4a', '.ogg'];
const textExts = ['.txt', '.md', '.log', '.json', '.xml', '.html', '.css', '.js', '.py', '.sh', '.bat', '.yml', '.yaml', '.ini', '.conf', '.cfg', '.csv'];

// const isImage = (ext: string) => imageExts.includes(ext.toLowerCase());

const getIconColor = (item: FileItem) => {
  if (item.isDirectory) return '#eab308'; // Windows folder yellow
  const ext = item.extension.toLowerCase();
  if (imageExts.includes(ext)) return '#22c55e';
  if (videoExts.includes(ext)) return '#f43f5e';
  if (audioExts.includes(ext)) return '#a855f7';
  if (textExts.includes(ext)) return '#3b82f6';
  return '#94a3b8';
};

// --- Context Menu ---
const openContextMenu = (e: MouseEvent, item: FileItem | null) => {
  e.preventDefault();
  if (item && !selectedItems.value.includes(item.name)) {
    selectedItems.value = [item.name];
  }
  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    item
  };
};

const closeContextMenu = () => {
  contextMenu.value.visible = false;
};

// --- Shortcuts ---
const handleGlobalKeydown = (e: KeyboardEvent) => {
  // Only handle if this window is active (simplified check)
  if (document.activeElement?.tagName === 'INPUT') return;

  if (e.ctrlKey && e.key === 'a') {
    e.preventDefault();
    selectAll();
  } else if (e.key === 'Delete') {
    deleteSelected();
  } else if (e.key === 'F2' && selectedItems.value.length === 1) {
    const item = fileStore.sortedItems.find(i => i.name === selectedItems.value[0]);
    if (item) startRename(item);
  } else if (e.key === 'Backspace' && !searchQuery.value) {
    goBack();
  } else if (e.ctrlKey && e.key === 'f') {
    e.preventDefault();
    searchInput.value?.focus();
  }
};

// --- DND ---
const onDragStart = (e: DragEvent, item: FileItem) => {
  e.dataTransfer?.setData('application/nubeos-item', item.name);
  e.dataTransfer?.setData('application/nubeos-path', fileStore.currentPath);
  fileStore.draggedItem = item;
};

const onDragOver = (e: DragEvent, targetItem?: FileItem) => {
  e.preventDefault();
  if (targetItem?.isDirectory) {
    fileStore.dropTarget = targetItem.name;
  } else {
    fileStore.dropTarget = null;
  }
};

const onDrop = async (e: DragEvent, targetItem?: FileItem) => {
  e.preventDefault();
  const itemName = e.dataTransfer?.getData('application/nubeos-item');
  const fromPath = e.dataTransfer?.getData('application/nubeos-path');
  
  if (itemName && fromPath !== undefined && targetItem?.isDirectory) {
    const toPath = fileStore.currentPath ? `${fileStore.currentPath}/${targetItem.name}` : targetItem.name;
    if (fromPath === toPath) return;
    await fileStore.moveItem(itemName, fromPath, toPath);
  }
  
  fileStore.dropTarget = null;
  fileStore.draggedItem = null;
};

const handleNativeDrop = (e: DragEvent) => {
  e.preventDefault();
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    fileStore.uploadFiles(files);
  }
};

const handleDblClick = (item: FileItem) => {
  if (item.isDirectory) {
    navigateTo(item.relativePath || (fileStore.currentPath ? `${fileStore.currentPath}/${item.name}` : item.name));
  } else {
    // Open preview or download
  }
};

const downloadFile = (item: FileItem) => {
  const url = fileStore.getDownloadUrl(item.name);
  window.open(url, '_blank');
};

const currentItemMetadata = computed(() => {
  if (selectedItems.value.length !== 1) return null;
  return fileStore.sortedItems.find(i => i.name === selectedItems.value[0]);
});

</script>

<template>
  <div 
    class="explorer-container glass-container" 
    @dragover.prevent 
    @drop="handleNativeDrop"
    @contextmenu.prevent="openContextMenu($event, null)"
  >
    <!-- Sidebar Panel -->
    <aside v-if="showSidebar" class="explorer-sidebar">
      <div class="sidebar-section">
        <header>Acceso rápido</header>
        <button class="nav-item" :class="{ active: fileStore.currentPath === '' }" @click="navigateTo('')">
          <HardDrive :size="16" /> <span>Este equipo</span>
        </button>
        <button class="nav-item">
          <Star :size="16" /> <span>Favoritos</span>
        </button>
        <button class="nav-item">
          <Clock :size="16" /> <span>Recientes</span>
        </button>
      </div>

      <div class="sidebar-section">
        <header>Carpetas</header>
        <div class="tree-root">
          <div v-for="node in fileStore.folderTree" :key="node.path" class="tree-item">
            <div class="tree-row" :class="{ active: fileStore.currentPath === node.path }" @click="navigateTo(node.path)">
              <ChevronRight :size="14" class="expander" />
              <Folder :size="16" color="#eab308" />
              <span>{{ node.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="externalDrives.length > 0" class="sidebar-section fade-in">
        <header>Unidades externas</header>
        <div class="tree-root">
          <button 
            v-for="drive in externalDrives" 
            :key="drive.id"
            class="nav-item"
            :class="{ active: fileStore.currentPath === drive.path }"
            @click="navigateTo(drive.path)"
          >
            <HardDrive :size="16" color="#f97316" />
            <span>{{ drive.label }}</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Section -->
    <section class="explorer-main">
      <!-- Toolbar -->
      <nav class="explorer-toolbar">
        <div class="toolbar-nav">
          <button class="tool-btn" :disabled="!fileStore.canGoBack" @click="goBack"><ArrowLeft :size="18"/></button>
          <button class="tool-btn" :disabled="!fileStore.canGoForward" @click="goForward"><ArrowRight :size="18"/></button>
          <button class="tool-btn" @click="navigateTo('')"><ChevronDown :size="18"/></button>
        </div>

        <div class="address-bar glass">
          <div class="breadcrumb-list">
            <button class="bc-item" @click="navigateTo('')">Este equipo</button>
            <template v-for="seg in fileStore.pathSegments" :key="seg.path">
              <span class="bc-sep"><ChevronRight :size="14"/></span>
              <button class="bc-item" @click="navigateTo(seg.path)">{{ seg.name }}</button>
            </template>
          </div>
          <button class="tool-btn refresh"><RotateCcw :size="14"/></button>
        </div>

        <div class="search-box glass">
          <Search :size="16" class="search-icon" />
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Buscar en la carpeta..." 
            ref="searchInput"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search"><X :size="14"/></button>
        </div>
      </nav>

      <!-- Action Ribbon -->
      <div class="action-ribbon">
        <div class="ribbon-group">
          <button class="ribbon-btn" @click="triggerUpload">
            <Upload :size="18"/> <span>Subir</span>
          </button>
          <button class="ribbon-btn" @click="createFolder">
            <Plus :size="18"/> <span>Nueva</span>
          </button>
        </div>
        <div class="ribbon-divider"></div>
        <div class="ribbon-group" :class="{ disabled: selectedItems.length === 0 }">
          <button class="ribbon-btn" @click="deleteSelected" :disabled="selectedItems.length === 0">
            <Trash2 :size="18"/> <span>Eliminar</span>
          </button>
          <button class="ribbon-btn" :disabled="selectedItems.length === 0" @click="selectedItems.length === 1 && startRename(fileStore.sortedItems.find(i => i.name === selectedItems[0])!)">
            <Edit2 :size="18"/> <span>Renombrar</span>
          </button>
        </div>
        <div class="ribbon-divider"></div>
        <div class="ribbon-group">
          <button class="ribbon-btn" @click="viewMode = 'grid'" :class="{ active: viewMode === 'grid' }"><Grid :size="18"/></button>
          <button class="ribbon-btn" @click="viewMode = 'list'" :class="{ active: viewMode === 'list' }"><List :size="18"/></button>
          <button class="ribbon-btn" @click="viewMode = 'details'" :class="{ active: viewMode === 'details' }"><Table :size="18"/></button>
        </div>
        <div class="spacer"></div>
        <button class="ribbon-btn" @click="showInfoPanel = !showInfoPanel" :class="{ active: showInfoPanel }">
          <Info :size="18"/>
        </button>
      </div>

      <!-- File Area -->
      <div 
        class="file-area-container" 
        @click="clearSelection"
        @contextmenu.self="openContextMenu($event, null)"
      >
        <div 
          v-if="fileStore.loading" 
          class="center-msg"
        >
          <div class="spinner"></div>
          <span>Cargando archivos...</span>
        </div>

        <div 
          v-else-if="fileStore.sortedItems.length === 0" 
          class="center-msg empty"
        >
          <FileSearch :size="48" />
          <p>{{ searchQuery ? 'No se encontraron resultados' : 'Esta carpeta está vacía' }}</p>
        </div>

        <div 
          v-else 
          class="file-area-inner" 
          :class="viewMode"
          ref="fileAreaRef"
        >
          <!-- Details Header -->
          <div v-if="viewMode === 'details'" class="details-header">
            <div class="col-name" @click="fileStore.setSort('name')">Nombre <SortAsc v-if="fileStore.sortField === 'name'" :size="12" :class="{ desc: fileStore.sortOrder === 'desc' }"/></div>
            <div class="col-date" @click="fileStore.setSort('modified')">Fecha <SortAsc v-if="fileStore.sortField === 'modified'" :size="12" :class="{ desc: fileStore.sortOrder === 'desc' }"/></div>
            <div class="col-type" @click="fileStore.setSort('type')">Tipo</div>
            <div class="col-size" @click="fileStore.setSort('size')">Tamaño <SortAsc v-if="fileStore.sortField === 'size'" :size="12" :class="{ desc: fileStore.sortOrder === 'desc' }"/></div>
          </div>

          <!-- Items -->
          <div 
            v-for="item in fileStore.sortedItems" 
            :key="item.name"
            class="file-item-row"
            :class="{ 
              selected: selectedItems.includes(item.name),
              'is-dragging': fileStore.draggedItem?.name === item.name,
              'drop-target': fileStore.dropTarget === item.name,
              'is-cut': fileStore.clipboard.item?.name === item.name && fileStore.clipboard.type === 'cut'
            }"
            @click.stop="toggleSelect(item, $event)"
            @dblclick="handleDblClick(item)"
            @contextmenu.stop="openContextMenu($event, item)"
            draggable="true"
            @dragstart="onDragStart($event, item)"
            @dragover="onDragOver($event, item)"
            @drop="onDrop($event, item)"
          >
            <div class="item-main">
              <div class="item-icon">
                <Folder v-if="item.isDirectory" :size="viewMode === 'grid' ? 48 : 20" :color="getIconColor(item)" fill="#eab30822" />
                <FileImage v-else-if="imageExts.includes(item.extension.toLowerCase())" :size="viewMode === 'grid' ? 48 : 20" :color="getIconColor(item)" />
                <FileVideo v-else-if="videoExts.includes(item.extension.toLowerCase())" :size="viewMode === 'grid' ? 48 : 20" :color="getIconColor(item)" />
                <FileText v-else :size="viewMode === 'grid' ? 48 : 20" :color="getIconColor(item)" />
              </div>
              <div class="item-name-box">
                <input 
                  v-if="renamingItem?.name === item.name"
                  v-model="newNameValue"
                  class="rename-box"
                  @keyup.enter="confirmRename"
                  @keyup.esc="renamingItem = null"
                  @blur="confirmRename"
                  ref="renameInput"
                  @click.stop
                />
                <span v-else class="item-name">{{ item.name }}</span>
              </div>
            </div>
            
            <template v-if="viewMode === 'details'">
              <span class="col-date">{{ new Date(item.modified).toLocaleDateString() }}</span>
              <span class="col-type">{{ item.isDirectory ? 'Carpeta' : (item.extension.toUpperCase().slice(1) || 'Archivo') }}</span>
              <span class="col-size">{{ item.isDirectory ? '' : formatSize(item.size) }}</span>
            </template>
            <span v-else-if="viewMode === 'list'" class="item-meta">{{ item.isDirectory ? 'Carpeta' : formatSize(item.size) }}</span>
          </div>
        </div>
      </div>

      <!-- Status Bar -->
      <footer class="explorer-status">
        <div class="status-left">
          <span>{{ fileStore.itemCount.total }} elementos</span>
          <span v-if="selectedItems.length > 0" class="selection-info">
            | {{ selectedItems.length }} seleccionados
            <span v-if="selectedItems.length === 1"> ({{ formatSize(currentItemMetadata?.size || 0) }})</span>
          </span>
        </div>
        <div class="status-right">
          <button class="status-btn" @click="viewMode = 'grid'"><Grid :size="14"/></button>
          <button class="status-btn" @click="viewMode = 'details'"><List :size="14"/></button>
        </div>
      </footer>
    </section>

    <!-- Info Panel (Right) -->
    <aside v-if="showInfoPanel" class="explorer-info glass-panel">
      <div v-if="currentItemMetadata" class="info-content">
        <header class="info-header">
           <Folder v-if="currentItemMetadata.isDirectory" :size="64" color="#eab308" />
           <File v-else :size="64" color="#94a3b8" />
           <h3>{{ currentItemMetadata.name }}</h3>
        </header>
        <div class="info-grid">
          <div class="info-row"><label>Tipo:</label> <span>{{ currentItemMetadata.isDirectory ? 'Carpeta' : 'Archivo' }}</span></div>
          <div class="info-row"><label>Tamaño:</label> <span>{{ formatSize(currentItemMetadata.size) }}</span></div>
          <div class="info-row"><label>Modificado:</label> <span>{{ new Date(currentItemMetadata.modified).toLocaleString() }}</span></div>
        </div>
        <div class="info-actions">
           <button class="btn btn-primary" @click="downloadFile(currentItemMetadata)">Descargar</button>
        </div>
      </div>
      <div v-else class="info-empty">
        <Info :size="48" />
        <p>Selecciona un archivo para ver sus detalles</p>
      </div>
    </aside>

    <!-- Upload Input Hidden -->
    <input id="file-upload-main" type="file" multiple style="display: none" @change="handleFileUpload" />

    <!-- Context Menu -->
    <Teleport to="body">
      <div v-if="contextMenu.visible" 
           class="win-context-menu glass" 
           :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
           @click.stop>
        <template v-if="contextMenu.item">
          <button @click="handleDblClick(contextMenu.item!)"><Layout :size="14"/> Abrir</button>
          <div class="divider"></div>
          <button @click="fileStore.setClipboard(contextMenu.item!, 'copy')"><Copy :size="14"/> Copiar</button>
          <button @click="fileStore.setClipboard(contextMenu.item!, 'cut')"><Scissors :size="14"/> Cortar</button>
          <div class="divider"></div>
          <button @click="startRename(contextMenu.item!)"><Edit2 :size="14"/> Renombrar</button>
          <button @click="deleteSelected" class="danger"><Trash2 :size="14"/> Eliminar</button>
          <div class="divider"></div>
          <button @click="downloadFile(contextMenu.item!)"><Download :size="14"/> Descargar</button>
        </template>
        <template v-else>
          <button @click="createFolder"><Plus :size="14"/> Nueva carpeta</button>
          <button @click="triggerUpload"><Upload :size="14"/> Subir archivos</button>
          <div class="divider" v-if="fileStore.clipboard.item"></div>
          <button v-if="fileStore.clipboard.item" @click="fileStore.pasteItem()"><ClipboardPaste :size="14"/> Pegar</button>
          <div class="divider"></div>
          <button @click="fileStore.fetchFiles(fileStore.currentPath)"><RotateCcw :size="14"/> Actualizar</button>
        </template>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.explorer-container {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.6);
  color: #e2e8f0;
  font-size: 0.85rem;
}

/* Sidebar */
.explorer-sidebar {
  width: 220px;
  background: rgba(0, 0, 0, 0.2);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
  user-select: none;
}

.sidebar-section {
  margin-bottom: 1.5rem;
}

.sidebar-section header {
  padding: 0 1.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1.25rem;
  background: transparent;
  color: #94a3b8;
  border-radius: 0;
  transition: all 0.2s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.nav-item.active {
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
  border-left: 3px solid #6366f1;
}

.tree-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 1.25rem;
  cursor: pointer;
  color: #94a3b8;
}

.tree-row:hover { color: white; }
.tree-row.active { color: #818cf8; }

/* Main Area */
.explorer-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.explorer-toolbar {
  height: 48px;
  min-height: 48px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1rem;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.toolbar-nav {
  display: flex;
  gap: 2px;
}

.tool-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #cbd5e1;
}

.tool-btn:disabled { opacity: 0.3; cursor: default; }
.tool-btn:not(:disabled):hover { background: rgba(255, 255, 255, 0.1); color: white; }

.address-bar {
  flex: 1;
  height: 32px;
  display: flex;
  align-items: center;
  padding: 0 0.75rem;
  overflow: hidden;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  overflow-x: auto;
  scrollbar-width: none;
}

.bc-item {
  background: transparent;
  color: #cbd5e1;
  font-size: 0.85rem;
  white-space: nowrap;
  padding: 2px 6px;
  border-radius: 4px;
}

.bc-item:hover { background: rgba(255, 255, 255, 0.1); }
.bc-sep { color: #475569; margin: 0 2px; }

.search-box {
  width: 240px;
  height: 32px;
  display: flex;
  align-items: center;
  padding: 0 0.5rem;
  gap: 0.5rem;
}

.search-box input {
  background: transparent;
  border: none;
  padding: 0;
  font-size: 0.82rem;
  width: 100%;
}

.search-icon { color: #64748b; }

/* Action Ribbon */
.action-ribbon {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.01);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.ribbon-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 60px;
  padding: 6px;
  background: transparent;
  color: #cbd5e1;
  font-size: 0.72rem;
  border-radius: 8px;
}

.ribbon-btn:hover:not(:disabled) { background: rgba(255, 255, 255, 0.08); }
.ribbon-btn.active { background: rgba(99, 102, 241, 0.2); color: #818cf8; }
.ribbon-btn.disabled, .ribbon-btn:disabled { opacity: 0.4; pointer-events: none; }

.ribbon-divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 4px;
}

/* File Area */
.file-area-container {
  flex: 1;
  overflow: auto;
  position: relative;
}

.file-area-inner {
  padding: 1rem;
  min-height: 100%;
}

/* Grid View */
.file-area-inner.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.5rem;
}

.grid .file-item-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.1s;
}

.grid .item-main { display: contents; }
.grid .item-name {
  margin-top: 0.5rem;
  word-break: break-all;
  max-width: 100%;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* List/Details View */
.file-area-inner.list, .file-area-inner.details {
  display: flex;
  flex-direction: column;
}

.file-item-row {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  gap: 1rem;
  border: 1px solid transparent;
  cursor: pointer;
}

.file-item-row:hover { background: rgba(255, 255, 255, 0.05); }
.file-item-row.selected { background: rgba(99, 102, 241, 0.15); border-color: rgba(99, 102, 241, 0.3); }
.file-item-row.is-cut { opacity: 0.4; }
.file-item-row.drop-target { background: rgba(34, 197, 94, 0.2); border: 1px dashed #22c55e; }

.item-main { flex: 1; display: flex; align-items: center; gap: 0.75rem; min-width: 200px; }
.details-header {
  display: flex;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #64748b;
  font-weight: 600;
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
}

.col-name { flex: 1; min-width: 200px; }
.col-date { width: 140px; }
.col-type { width: 100px; }
.col-size { width: 80px; text-align: right; }

.rename-box {
  width: 100%;
  background: #0f172a;
  border: 1px solid #6366f1;
  color: white;
  padding: 2px 4px;
  border-radius: 4px;
}

/* Info Panel */
.explorer-info {
  width: 280px;
  background: rgba(0, 0, 0, 0.3);
  border-left: 1px solid rgba(255, 255, 255, 0.05);
  padding: 1.5rem;
  overflow-y: auto;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 0.4rem;
}

.info-row label { color: #64748b; }

/* Status Bar */
.explorer-status {
  height: 28px;
  padding: 0 1rem;
  background: rgba(0, 0, 0, 0.4);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: #64748b;
}

.selection-info { font-weight: 600; color: #94a3b8; }

/* Context Menu */
.win-context-menu {
  position: fixed;
  z-index: 10000;
  min-width: 180px;
  padding: 4px;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  background: #1e293b;
}

.win-context-menu button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  background: transparent;
  color: #e2e8f0;
  font-size: 0.8rem;
  border-radius: 4px;
}

.win-context-menu button:hover { background: rgba(255, 255, 255, 0.08); }
.win-context-menu button.danger:hover { background: rgba(239, 68, 68, 0.2); color: #f87171; }
.win-context-menu .divider { height: 1px; background: rgba(255, 255, 255, 0.1); margin: 4px; }

.glass-container { backdrop-filter: blur(20px); }
.spacer { flex: 1; }
</style>
