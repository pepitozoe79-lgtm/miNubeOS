import { defineStore } from 'pinia';
import axios from 'axios';

export interface FileItem {
  name: string;
  isDirectory: boolean;
  size: number;
  modified: string;
  extension: string;
}

export interface UploadingFile {
  name: string;
  progress: number;
  size: number;
}

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
    }
  }),

  actions: {
    async fetchFiles(path: string = '') {
      this.loading = true;
      try {
        const response = await axios.get(`/api/files/list?path=${path}`);
        this.items = response.data.items;
        this.currentPath = response.data.currentPath;
      } catch (err: any) {
        this.error = err.response?.data?.error || 'Error al obtener archivos';
      } finally {
        this.loading = false;
      }
    },

    async renameItem(oldName: string, newName: string) {
      try {
        await axios.post('/api/files/rename', {
          path: this.currentPath,
          oldName,
          newName
        });
        await this.fetchFiles(this.currentPath);
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
        
        await this.fetchFiles(this.currentPath);
      } catch (error: any) {
        alert(error.response?.data?.error || 'Error al pegar');
      }
    },

    async createFolder(folderName: string) {
      try {
        await axios.post('/api/files/mkdir', { folderName, path: this.currentPath });
        await this.fetchFiles(this.currentPath);
      } catch (err: any) {
        alert(err.response?.data?.error || 'Error al crear carpeta');
      }
    },

    async deleteItems(names: string[]) {
      try {
        await axios.delete('/api/files/delete', { data: { items: names, path: this.currentPath } });
        await this.fetchFiles(this.currentPath);
      } catch (err: any) {
        alert(err.response?.data?.error || 'Error al eliminar');
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
        
        if (file.size <= CHUNK_SIZE) {
          // Small file: Standard upload
          const formData = new FormData();
          formData.append('files', file);
          
          try {
            await axios.post(`/api/files/upload?path=${this.currentPath}`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
              onUploadProgress: (p) => {
                const percent = Math.round((p.loaded * 100) / (p.total || 1));
                this.updateFileProgress(file.name, percent);
              }
            });
          } catch (err) {
            console.error(`Error subiendo ${file.name}:`, err);
          }
        } else {
          // Large file: Chunked upload
          const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
          const uploadId = Math.random().toString(36).substring(7) + Date.now();

          for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            const start = chunkIndex * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);

            const formData = new FormData();
            // Appending primitive fields BEFORE the file chunk helps backend parsers
            formData.append('chunkIndex', chunkIndex.toString());
            formData.append('totalChunks', totalChunks.toString());
            formData.append('fileName', file.name);
            formData.append('path', this.currentPath);
            formData.append('uploadId', uploadId);
            formData.append('chunk', chunk); 

            try {
              await axios.post('/api/files/upload/chunk', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });
              
              const percent = Math.round(((chunkIndex + 1) * 100) / totalChunks);
              this.updateFileProgress(file.name, percent);
            } catch (err) {
              console.error(`Error en chunk ${chunkIndex} de ${file.name}:`, err);
              break; 
            }
          }
        }
      }

      setTimeout(async () => {
        this.uploading = false;
        this.uploadingFiles = [];
        await this.fetchFiles(this.currentPath);
      }, 500);
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
