import { defineStore } from 'pinia';

export type WindowApp = 'files' | 'apps' | 'admin' | 'settings' | 'monitor';

export interface WindowState {
  id: WindowApp;
  title: string;
  isOpen: boolean;
  zIndex: number;
  isMinimized: boolean;
}

export const useDesktopStore = defineStore('desktop', {
  state: () => ({
    wallpaper: localStorage.getItem('nubeos_wallpaper') || '/wallpapers/wp0.png',
    windows: {
      files: { id: 'files', title: 'Explorador de Archivos', isOpen: false, zIndex: 10, isMinimized: false },
      apps: { id: 'apps', title: 'Centro de Aplicaciones', isOpen: false, zIndex: 10, isMinimized: false },
      admin: { id: 'admin', title: 'Panel de Control', isOpen: false, zIndex: 10, isMinimized: false },
      settings: { id: 'settings', title: 'Configuración', isOpen: false, zIndex: 10, isMinimized: false },
      monitor: { id: 'monitor', title: 'Monitor del Sistema', isOpen: false, zIndex: 10, isMinimized: false },
    } as Record<WindowApp, WindowState>,
    topZIndex: 100,
  }),

  actions: {
    openWindow(app: WindowApp) {
      const win = this.windows[app];
      win.isOpen = true;
      win.isMinimized = false;
      this.focusWindow(app);
    },
    closeWindow(app: WindowApp) {
      this.windows[app].isOpen = false;
    },
    toggleMinimize(app: WindowApp) {
      this.windows[app].isMinimized = !this.windows[app].isMinimized;
      if (!this.windows[app].isMinimized) this.focusWindow(app);
    },
    focusWindow(app: WindowApp) {
      this.topZIndex++;
      this.windows[app].zIndex = this.topZIndex;
    },
    setWallpaper(url: string) {
      this.wallpaper = url;
      localStorage.setItem('nubeos_wallpaper', url);
    }
  }
});
