import { defineStore } from 'pinia';

export type WindowApp = 'files' | 'apps' | 'admin' | 'settings' | 'monitor';

export interface WindowState {
  id: WindowApp;
  title: string;
  isOpen: boolean;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  x: number;
  y: number;
}

export const useDesktopStore = defineStore('desktop', {
  state: () => ({
    wallpaper: localStorage.getItem('nubeos_wallpaper') || '/wallpapers/wp0.png',
    windows: {
      files: { id: 'files', title: 'Explorador de Archivos', isOpen: false, zIndex: 10, isMinimized: false, isMaximized: false, x: -1, y: -1 },
      apps: { id: 'apps', title: 'Centro de Aplicaciones', isOpen: false, zIndex: 10, isMinimized: false, isMaximized: false, x: -1, y: -1 },
      admin: { id: 'admin', title: 'Panel de Control', isOpen: false, zIndex: 10, isMinimized: false, isMaximized: false, x: -1, y: -1 },
      settings: { id: 'settings', title: 'Configuración', isOpen: false, zIndex: 10, isMinimized: false, isMaximized: false, x: -1, y: -1 },
      monitor: { id: 'monitor', title: 'Monitor del Sistema', isOpen: false, zIndex: 10, isMinimized: false, isMaximized: false, x: -1, y: -1 },
    } as Record<WindowApp, WindowState>,
    topZIndex: 100,
  }),

  actions: {
    openWindow(app: WindowApp) {
      const win = this.windows[app];
      win.isOpen = true;
      win.isMinimized = false;
      win.isMaximized = false;
      // Center window if no position set
      if (win.x === -1) {
        win.x = Math.max(0, (window.innerWidth - 900) / 2);
        win.y = Math.max(0, (window.innerHeight - 600) / 2);
      }
      this.focusWindow(app);
    },
    closeWindow(app: WindowApp) {
      this.windows[app].isOpen = false;
    },
    toggleMinimize(app: WindowApp) {
      this.windows[app].isMinimized = !this.windows[app].isMinimized;
      if (!this.windows[app].isMinimized) this.focusWindow(app);
    },
    toggleMaximize(app: WindowApp) {
      this.windows[app].isMaximized = !this.windows[app].isMaximized;
      this.focusWindow(app);
    },
    moveWindow(app: WindowApp, x: number, y: number) {
      this.windows[app].x = x;
      this.windows[app].y = y;
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
