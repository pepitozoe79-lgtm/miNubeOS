import { defineStore } from 'pinia';
import axios from 'axios';

export interface FileItem {
  name: string;
  isDirectory: boolean;
  size: number;
  modified: string;
  extension: string;
  relativePath?: string;
  parentPath?: string;
}

export interface UploadingFile {
  name: string;
  progress: number;
  size: number;
}

export interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[];
  expanded?: boolean;
}

export type SortField = 'name' | 'size' | 'modified' | 'type';
export type SortOrder = 'asc' | 'desc';

export const useFileStore = defineStore('files', {
  state: () => ({
    currentPath: '',
    items: [] as FileItem[],
    loading: false,
    error: null as string | null,
    uploading: false,
    uploadingFiles: [] as UploadingFile[],
    clipboard: {
      item: null as FileItem | null,
      type: null as 'copy' | 'cut' | null,
      fromPath: ''
    },
    // Navigation history
    history: [] as string[],
    historyIndex: -1,
    // Search
    searchQuery: '',
    searchResults: [] as FileItem[],
    isSearching: false,
    // Folder tree
    folderTree: [] as TreeNode[],
    // Sorting
    sortField: 'name' as SortField,
    sortOrder: 'asc' as SortOrder,
    // Drag & Drop
    draggedItem: null as FileItem | null,
    dropTarget: null as string | null,
  }),

  getters: {
    sortedItems(state): FileItem[] {
      const itemsToSort = state.searchQuery ? state.searchResults : [...state.items];

      // Directories first, then sort within each group
      const dirs = itemsToSort.filter(i => i.isDirectory);
      const files = itemsToSort.filter(i => !i.isDirectory);

      const sortFn = (a: FileItem, b: FileItem) => {
        let cmp = 0;
        switch (state.sortField) {
          case 'name':
            cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
            break;
          case 'size':
            cmp = a.size - b.size;
            break;
          case 'modified':
            cmp = new Date(a.modified).getTime() - new Date(b.modified).getTime();
            break;
          case 'type':
            cmp = (a.extension || '').localeCompare(b.extension || '');
            break;
        }
        return state.sortOrder === 'asc' ? cmp : -cmp;
      };

      dirs.sort(sortFn);
      files.sort(sortFn);
      return [...dirs, ...files];
    },

    canGoBack(state): boolean {
      return state.historyIndex > 0;
    },

    canGoForward(state): boolean {
      return state.historyIndex < state.history.length - 1;
    },

    pathSegments(state): { name: string; path: string }[] {
      if (!state.currentPath) return [];
      const parts = state.currentPath.split('/');
      return parts.map((part, index) => ({
        name: part,
        path: parts.slice(0, index + 1).join('/')
      }));
    },

    totalSize(state): number {
      return state.items.reduce((sum, item) => sum + (item.size || 0), 0);
    },

    itemCount(state): { total: number; files: number; folders: number } {
      const files = state.items.filter(i => !i.isDirectory).length;
      const folders = state.items.filter(i => i.isDirectory).length;
      return { total: state.items.length, files, folders };
    }
  },

  actions: {
    async fetchFiles(path: string = '', addToHistory = true) {
      this.loading = true;
      this.searchQuery = '';
      this.searchResults = [];
      try {
        const response = await axios.get(`/api/files/list?path=${path}`);
        this.items = response.data.items;
        this.currentPath = response.data.currentPath;

        if (addToHistory) {
          // Trim forward history when navigating new path
          if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
          }
          this.history.push(path);
          this.historyIndex = this.history.length - 1;
        }
      } catch (err: any) {
        this.error = err.response?.data?.error || 'Error al obtener archivos';
      } finally {
        this.loading = false;
      }
    },

    goBack() {
      if (this.canGoBack) {
        this.historyIndex--;
        this.fetchFiles(this.history[this.historyIndex], false);
      }
    },

    goForward() {
      if (this.canGoForward) {
        this.historyIndex++;
        this.fetchFiles(this.history[this.historyIndex], false);
      }
    },

    navigateToPath(path: string) {
      this.fetchFiles(path);
    },

    async renameItem(oldName: string, newName: string) {
      try {
        await axios.post('/api/files/rename', {
          path: this.currentPath,
          oldName,
          newName
        });
        await this.fetchFiles(this.currentPath, false);
        await this.fetchFolderTree();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Error al renombrar');
      }
    },

    setClipboard(item: FileItem, type: 'copy' | 'cut') {
      this.clipboard = {
        item,
        type,
        fromPath: this.currentPath
      };
    },

    async pasteItem() {
      if (!this.clipboard.item || !this.clipboard.type) return;

      const endpoint = this.clipboard.type === 'copy' ? '/api/files/copy' : '/api/files/move';

      try {
        await axios.post(endpoint, {
          fromPath: this.clipboard.fromPath,
          toPath: this.currentPath,
          name: this.clipboard.item.name
        });

        if (this.clipboard.type === 'cut') {
          this.clipboard = { item: null, type: null, fromPath: '' };
        }

        await this.fetchFiles(this.currentPath, false);
        await this.fetchFolderTree();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Error al pegar');
      }
    },

    async createFolder(folderName: string) {
      try {
        await axios.post('/api/files/mkdir', { folderName, path: this.currentPath });
        await this.fetchFiles(this.currentPath, false);
        await this.fetchFolderTree();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Error al crear carpeta');
      }
    },

    async deleteItems(names: string[]) {
      try {
        await axios.delete('/api/files/delete', { data: { items: names, path: this.currentPath } });
        await this.fetchFiles(this.currentPath, false);
        await this.fetchFolderTree();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Error al eliminar');
      }
    },

    async searchFiles(query: string) {
      this.searchQuery = query;
      if (!query.trim()) {
        this.searchResults = [];
        this.isSearching = false;
        return;
      }

      this.isSearching = true;
      try {
        const response = await axios.get(`/api/files/search?q=${encodeURIComponent(query)}&path=${this.currentPath}`);
        this.searchResults = response.data.results;
      } catch (err: any) {
        this.searchResults = [];
      } finally {
        this.isSearching = false;
      }
    },

    async fetchFolderTree() {
      try {
        const response = await axios.get('/api/files/tree');
        this.folderTree = response.data.tree;
      } catch (err) {
        this.folderTree = [];
      }
    },

    setSort(field: SortField) {
      if (this.sortField === field) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = field;
        this.sortOrder = 'asc';
      }
    },

    async moveItem(itemName: string, fromPath: string, toPath: string) {
      try {
        await axios.post('/api/files/move', {
          fromPath,
          toPath,
          name: itemName
        });
        await this.fetchFiles(this.currentPath, false);
        await this.fetchFolderTree();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Error al mover');
      }
    },

    async uploadFiles(files: FileList) {
      this.uploading = true;
      this.uploadingFiles = Array.from(files).map(f => ({
        name: f.name,
        progress: 0,
        size: f.size,
      }));

      const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Usamos una función interna con reintentos para cada archivo
        try {
          if (file.size <= CHUNK_SIZE) {
            await this.performUploadWithRetry(file, null);
          } else {
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            const uploadId = Math.random().toString(36).substring(7) + Date.now();

            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
              const start = chunkIndex * CHUNK_SIZE;
              const end = Math.min(start + CHUNK_SIZE, file.size);
              const chunk = file.slice(start, end);

              // Reintentar cada chunk individualmente
              await this.performUploadWithRetry(file, { chunk, chunkIndex, totalChunks, uploadId });
            }
          }
        } catch (err) {
          console.error(`Fallo crítico tras múltiples reintentos para ${file.name}:`, err);
        }
      }

      setTimeout(async () => {
        this.uploading = false;
        this.uploadingFiles = [];
        await this.fetchFiles(this.currentPath, false);
        await this.fetchFolderTree();
      }, 500);
    },

    async performUploadWithRetry(file: File, chunkData: any | null, retries = 3) {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const formData = new FormData();
          
          if (!chunkData) {
            // Carga normal
            formData.append('files', file);
            await axios.post(`/api/files/upload?path=${this.currentPath}`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
              onUploadProgress: (p) => {
                const percent = Math.round((p.loaded * 100) / (p.total || 1));
                this.updateFileProgress(file.name, percent);
              }
            });
          } else {
            // Carga por chunks
            formData.append('chunkIndex', chunkData.chunkIndex.toString());
            formData.append('totalChunks', chunkData.totalChunks.toString());
            formData.append('fileName', file.name);
            formData.append('path', this.currentPath);
            formData.append('uploadId', chunkData.uploadId);
            formData.append('chunk', chunkData.chunk);

            await axios.post('/api/files/upload/chunk', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });

            const percent = Math.round(((chunkData.chunkIndex + 1) * 100) / chunkData.totalChunks);
            this.updateFileProgress(file.name, percent);
          }
          return; // Éxito
        } catch (err) {
          if (attempt === retries) throw err;
          console.warn(`Intento ${attempt + 1} fallido para ${file.name}, reintentando en 2s...`);
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    },

    updateFileProgress(name: string, progress: number) {
      const file = this.uploadingFiles.find(f => f.name === name);
      if (file) {
        file.progress = progress;
      }
    },

    getPreviewUrl(fileName: string) {
      const token = localStorage.getItem('nubeos_token');
      return `/api/files/preview?path=${this.currentPath}&name=${encodeURIComponent(fileName)}&token=${token}`;
    },

    getDownloadUrl(fileName: string) {
      const token = localStorage.getItem('nubeos_token');
      return `/api/files/download?path=${this.currentPath}&name=${encodeURIComponent(fileName)}&token=${token}`;
    }
  }
});
