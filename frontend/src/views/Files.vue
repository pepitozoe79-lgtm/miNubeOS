<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from 'vue';
import { useFileStore } from '../stores/files';
import type { FileItem } from '../stores/files';
import { 
  Folder, 
  File, 
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  Upload, 
  Plus, 
  Trash2, 
  ChevronLeft,
  Grid,
  List,
  Download,
  X,
  Copy,
  Scissors,
  Edit2,
  Info,
  ClipboardPaste
} from 'lucide-vue-next';

const fileStore = useFileStore();
const selectedItems = ref<string[]>([]);
const viewMode = ref<'grid' | 'list'>('grid');

// UI States
const previewFile = ref<any>(null);
const propertiesItem = ref<FileItem | null>(null);
const contextMenu = ref({ visible: false, x: 0, y: 0, item: null as FileItem | null });
const renamingItem = ref<FileItem | null>(null);
const newNameValue = ref('');
const renameInput = ref<HTMLInputElement | null>(null);

onMounted(() => {
  fileStore.fetchFiles();
  window.addEventListener('click', closeContextMenu);
});

onUnmounted(() => {
  window.removeEventListener('click', closeContextMenu);
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
  if (target.files && target.files.length > 0) {
    fileStore.uploadFiles(target.files);
    target.value = '';
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

const deleteItem = (item: FileItem) => {
  if (confirm(`¿Eliminar "${item.name}"?`)) {
    fileStore.deleteItems([item.name]);
  }
};

const startRename = (item: FileItem) => {
  renamingItem.value = item;
  newNameValue.value = item.name;
  nextTick(() => {
    if (renameInput.value) {
      renameInput.value.focus();
      // Select name without extension if it's a file
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

const cancelRename = () => {
  renamingItem.value = null;
};

const showProperties = (item: FileItem) => {
  propertiesItem.value = item;
};

// Clipboard actions
const handleCopy = (item: FileItem) => {
  fileStore.setClipboard(item, 'copy');
};

const handleCut = (item: FileItem) => {
  fileStore.setClipboard(item, 'cut');
};

const handlePaste = () => {
  fileStore.pasteItem();
};

// Context Menu
const openContextMenu = (e: MouseEvent, item: FileItem | null) => {
  e.preventDefault();
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

const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
const videoExts = ['.mp4', '.webm', '.ogg', '.mov', '.mkv'];
const audioExts = ['.mp3', '.wav', '.flac', '.aac', '.m4a', '.ogg'];
const textExts = ['.txt', '.md', '.log', '.json', '.xml', '.html', '.css', '.js', '.py', '.sh', '.bat', '.yml', '.yaml', '.ini', '.conf', '.cfg', '.csv'];
const pdfExts = ['.pdf'];

const isPreviewable = (ext: string) => {
  return [...imageExts, ...videoExts, ...audioExts, ...textExts, ...pdfExts].includes(ext);
};

const getFileType = (ext: string) => {
  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  if (audioExts.includes(ext)) return 'audio';
  if (textExts.includes(ext)) return 'text';
  if (pdfExts.includes(ext)) return 'pdf';
  return 'other';
};

const openPreview = (item: any) => {
  if (item.isDirectory || !isPreviewable(item.extension)) return;
  previewFile.value = {
    ...item,
    type: getFileType(item.extension),
    url: fileStore.getPreviewUrl(item.name)
  };
};

const downloadFile = (name: string) => {
  const url = fileStore.getDownloadUrl(name);
  window.open(url, '_blank');
};

const handleDblClick = (item: any) => {
  if (item.isDirectory) {
    navigateTo(item.name);
  } else if (isPreviewable(item.extension)) {
    openPreview(item);
  }
};
</script>

<template>
  <div class="files-view fade-in" @contextmenu.self="openContextMenu($event, null)">
    <header class="files-header">
      <div class="breadcrumb">
        <button v-if="fileStore.currentPath" @click="goBack" class="back-btn">
          <ChevronLeft :size="20"/>
        </button>
        <span class="path">Archivos / {{ fileStore.currentPath }}</span>
      </div>

      <div class="actions">
        <input id="file-upload" type="file" multiple style="display: none" @change="handleFileUpload" />
        
        <button @click="triggerUpload" class="btn btn-secondary">
          <Upload :size="18"/> <span>Subir</span>
        </button>
        <button @click="createFolder" class="btn btn-secondary">
          <Plus :size="18"/> <span>Nueva Carpeta</span>
        </button>
        
        <button v-if="fileStore.clipboard.item" @click="handlePaste" class="btn btn-primary paste-btn">
          <ClipboardPaste :size="18"/> <span>Pegar</span>
        </button>

        <div class="view-toggle">
          <button @click="viewMode = 'grid'" :class="{ active: viewMode === 'grid' }"><Grid :size="18"/></button>
          <button @click="viewMode = 'list'" :class="{ active: viewMode === 'list' }"><List :size="18"/></button>
        </div>
      </div>
    </header>

    <div v-if="fileStore.uploading" class="upload-banner">
      <div class="upload-banner-header">
        <Upload :size="16" />
        <span>Subiendo {{ fileStore.uploadingFiles.length }} archivo(s)...</span>
      </div>
      <div v-for="uf in fileStore.uploadingFiles" :key="uf.name" class="upload-file-item">
        <span class="upload-filename">{{ uf.name }}</span>
        <div class="upload-progress-bar"><div class="upload-progress-fill" :style="{ width: uf.progress + '%' }"></div></div>
        <span class="upload-percent">{{ uf.progress }}%</span>
      </div>
    </div>

    <div v-if="fileStore.loading" class="loader">
      <div class="spinner"></div> Cargando archivos...
    </div>

    <div v-else class="file-area" :class="viewMode" @contextmenu.self="openContextMenu($event, null)">
      <div 
        v-for="item in fileStore.items" 
        :key="item.name"
        class="file-item glass"
        :class="{ 
          selected: selectedItems.includes(item.name),
          'is-cut': fileStore.clipboard.item?.name === item.name && fileStore.clipboard.type === 'cut',
          'is-renaming': renamingItem?.name === item.name
        }"
        @click="toggleSelect(item.name)"
        @dblclick="handleDblClick(item)"
        @contextmenu.stop="openContextMenu($event, item)"
      >
        <div class="icon">
          <Folder v-if="item.isDirectory" :size="48" color="#6366f1" fill="#6366f122" />
          <FileImage v-else-if="imageExts.includes(item.extension)" :size="48" color="#22c55e" />
          <FileVideo v-else-if="videoExts.includes(item.extension)" :size="48" color="#f59e0b" />
          <FileAudio v-else-if="audioExts.includes(item.extension)" :size="48" color="#ec4899" />
          <FileText v-else-if="textExts.includes(item.extension) || pdfExts.includes(item.extension)" :size="48" color="#3b82f6" />
          <File v-else :size="48" color="#cbd5e1" />
        </div>
        <div class="info">
          <input 
            v-if="renamingItem?.name === item.name"
            v-model="newNameValue"
            class="rename-input"
            @keyup.enter="confirmRename"
            @keyup.esc="cancelRename"
            @blur="confirmRename"
            ref="renameInput"
            @click.stop
          />
          <span v-else class="name">{{ item.name }}</span>
          <span class="meta" v-if="!item.isDirectory">{{ formatSize(item.size) }}</span>
        </div>
      </div>

      <div v-if="fileStore.items.length === 0" class="empty-state">
        <Folder :size="64" color="#334155" />
        <p>Esta carpeta está vacía</p>
      </div>
    </div>

    <!-- Context Menu -->
    <Teleport to="body">
      <div 
        v-if="contextMenu.visible" 
        class="context-menu glass" 
        :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
        @click="closeContextMenu"
      >
        <template v-if="contextMenu.item">
          <button @click="handleCopy(contextMenu.item!)">
            <Copy :size="14"/> Copiar
          </button>
          <button @click="handleCut(contextMenu.item!)">
            <Scissors :size="14"/> Cortar
          </button>
          <div class="divider"></div>
          <button @click="startRename(contextMenu.item!)">
            <Edit2 :size="14"/> Renombrar
          </button>
          <button @click="deleteItem(contextMenu.item!)" class="danger">
            <Trash2 :size="14"/> Eliminar
          </button>
          <div class="divider"></div>
          <button @click="showProperties(contextMenu.item!)">
            <Info :size="14"/> Propiedades
          </button>
        </template>
        <template v-else>
          <button @click="createFolder">
            <Plus :size="14"/> Nueva Carpeta
          </button>
          <button @click="triggerUpload">
            <Upload :size="14"/> Subir Archivo
          </button>
          <div class="divider" v-if="fileStore.clipboard.item"></div>
          <button v-if="fileStore.clipboard.item" @click="handlePaste">
            <ClipboardPaste :size="14"/> Pegar elemento
          </button>
        </template>
      </div>
    </Teleport>

    <!-- Properties Modal -->
    <Teleport to="body">
      <div v-if="propertiesItem" class="modal-overlay" @click="propertiesItem = null">
        <div class="modal glass properties-modal" @click.stop>
          <div class="modal-header">
            <h3>Propiedades</h3>
            <button @click="propertiesItem = null" class="close-btn"><X :size="20"/></button>
          </div>
          <div class="modal-body">
            <div class="prop-icon">
              <Folder v-if="propertiesItem.isDirectory" :size="64" color="#6366f1" />
              <File v-else :size="64" color="#94a3b8" />
            </div>
            <div class="prop-details">
              <div class="prop-row"><strong>Nombre:</strong> <span>{{ propertiesItem.name }}</span></div>
              <div class="prop-row"><strong>Tipo:</strong> <span>{{ propertiesItem.isDirectory ? 'Carpeta' : 'Archivo' }}</span></div>
              <div class="prop-row" v-if="!propertiesItem.isDirectory"><strong>Tamaño:</strong> <span>{{ formatSize(propertiesItem.size) }} ({{ propertiesItem.size }} bytes)</span></div>
              <div class="prop-row"><strong>Modificado:</strong> <span>{{ new Date(propertiesItem.modified).toLocaleString() }}</span></div>
              <div class="prop-row"><strong>Ubicación:</strong> <span>/{{ fileStore.currentPath }}</span></div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Preview Modal -->
    <Teleport to="body">
      <div v-if="previewFile" class="preview-overlay" @click.self="previewFile = null">
        <div class="preview-modal glass">
          <div class="preview-header">
            <span class="preview-title">{{ previewFile.name }}</span>
            <div class="preview-actions">
              <button @click="downloadFile(previewFile.name)" class="preview-btn" title="Descargar"><Download :size="18"/></button>
              <button @click="previewFile = null" class="preview-btn hex-close"><X :size="18"/></button>
            </div>
          </div>
          <div class="preview-content">
            <img v-if="previewFile.type === 'image'" :src="previewFile.url" :alt="previewFile.name" />
            <video v-else-if="previewFile.type === 'video'" :src="previewFile.url" controls autoplay />
            <div v-else-if="previewFile.type === 'audio'" class="audio-preview">
              <FileAudio :size="64" color="#ec4899" />
              <span>{{ previewFile.name }}</span>
              <audio :src="previewFile.url" controls autoplay />
            </div>
            <iframe v-else-if="previewFile.type === 'pdf'" :src="previewFile.url" />
            <iframe v-else-if="previewFile.type === 'text'" :src="previewFile.url" class="text-preview" />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.files-view { display: flex; flex-direction: column; gap: 1.5rem; min-height: 500px; }
.files-header { display: flex; justify-content: space-between; align-items: center; }
.breadcrumb { display: flex; align-items: center; gap: 1rem; }
.path { font-weight: 600; color: var(--text-muted); }
.actions { display: flex; gap: 0.75rem; align-items: center; }
.btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem; font-size: 0.85rem; }
.btn-secondary { background: rgba(255, 255, 255, 0.05); color: white; border: 1px solid var(--border); }
.paste-btn { background: var(--primary); font-weight: 700; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }

.view-toggle { display: flex; background: rgba(255, 255, 255, 0.05); border-radius: var(--radius); padding: 2px; }
.view-toggle button { padding: 0.5rem; background: transparent; color: var(--text-muted); }
.view-toggle button.active { background: var(--primary); color: white; }

.file-area { display: grid; gap: 1.25rem; min-height: 400px; }
.file-area.grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }

.file-item {
  position: relative; display: flex; flex-direction: column; align-items: center; 
  justify-content: center; padding: 1rem; aspect-ratio: 1/1; text-align: center;
  gap: 0.5rem; cursor: pointer; transition: all 0.2s; user-select: none;
}
.file-item:hover { background: rgba(255, 255, 255, 0.05); transform: translateY(-2px); }
.file-item.selected { border-color: var(--primary); background: rgba(99, 102, 241, 0.1); }
.file-item.is-cut { opacity: 0.4; border: 1px dashed var(--primary); }

.info { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; width: 100%; }
.name { font-size: 0.82rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; text-align: center; }
.meta { font-size: 0.7rem; color: var(--text-muted); }

.rename-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--primary);
  border-radius: 4px;
  color: white;
  padding: 2px 4px;
  font-size: 0.82rem;
  text-align: center;
}
.rename-input:focus { outline: none; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3); }

/* Context Menu Style */
.context-menu {
  position: fixed; z-index: 20000; min-width: 180px;
  padding: 0.5rem; border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
  animation: contextIn 0.15s ease-out;
}
@keyframes contextIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

.context-menu button {
  width: 100%; display: flex; align-items: center; gap: 0.75rem;
  padding: 0.6rem 0.75rem; font-size: 0.85rem; border-radius: 8px;
  background: transparent; color: white; transition: all 0.15s;
}
.context-menu button:hover { background: rgba(255,255,255,0.08); }
.context-menu button.danger { color: #fca5a5; }
.context-menu button.danger:hover { background: rgba(239, 68, 68, 0.2); }
.context-menu .divider { height: 1px; background: var(--border); margin: 0.4rem; opacity: 0.5; }

/* Modals */
.modal-overlay {
  position: fixed; inset: 0; z-index: 20001;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.modal { width: 400px; padding: 1.5rem; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.prop-icon { display: flex; justify-content: center; margin-bottom: 1.5rem; }
.prop-details { display: flex; flex-direction: column; gap: 0.75rem; }
.prop-row { display: flex; justify-content: space-between; font-size: 0.85rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem; }
.prop-row strong { color: var(--text-muted); }

/* Preview Modal Shared with previous implementation... */
.preview-overlay { position: fixed; inset: 0; z-index: 20002; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; padding: 2rem; }
.preview-modal { width: 90%; max-width: 1100px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; border-radius: 24px; }
.preview-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); }
.preview-content { flex: 1; display: flex; align-items: center; justify-content: center; overflow: auto; background: #000; min-height: 400px; }
.preview-content img, .preview-content video { max-width: 100%; max-height: 75vh; }
.preview-content iframe { width: 100%; height: 75vh; border: none; background: white; }
</style>
