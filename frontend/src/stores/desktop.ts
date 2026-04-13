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

export interface DesktopIcon {
  id: WindowApp;
  label: string;
  icon: string;
  color: 'blue' | 'purple' | 'green' | 'grey';
  x: number;
  y: number;
}

export const useDesktopStore = defineStore('desktop', {
  state: () => {
    // Load persisted icon positions or use defaults
    const savedIcons = localStorage.getItem('nubeos_desktop_icons');
    const defaultIcons: Record<string, DesktopIcon> = {
      files: { id: 'files', label: 'Archivos', icon: 'Folder', color: 'blue', x: 20, y: 20 },
      apps: { id: 'apps', label: 'App Center', icon: 'LayoutDashboard', color: 'purple', x: 20, y: 140 },
      monitor: { id: 'monitor', label: 'Monitor', icon: 'Activity', color: 'green', x: 20, y: 260 },
      admin: { id: 'admin', label: 'Panel Control', icon: 'Settings', color: 'grey', x: 20, y: 380 },
    };

    return {
      wallpaper: localStorage.getItem('nubeos_wallpaper') || '/wallpapers/wp0.png',
      windows: {
        files: { id: 'files', title: 'Explorador de Archivos', isOpen: false, zIndex: 10, isMinimized: false, isMaximized: false, x: -1, y: -1 },
        apps: { id: 'apps', title: 'Centro de Aplicaciones', isOpen: false, zIndex: 10, isMinimized: false, isMaximized: false, x: -1, y: -1 },
        admin: { id: 'admin', title: 'Panel de Control', isOpen: false, zIndex: 10, isMinimized: false, isMaximized: false, x: -1, y: -1 },
        settings: { id: 'settings', title: 'Configuración', isOpen: false, zIndex: 10, isMinimized: false, isMaximized: false, x: -1, y: -1 },
        monitor: { id: 'monitor', title: 'Monitor del Sistema', isOpen: false, zIndex: 10, isMinimized: false, isMaximized: false, x: -1, y: -1 },
      } as Record<WindowApp, WindowState>,
      desktopIcons: savedIcons ? JSON.parse(savedIcons) : defaultIcons as Record<string, DesktopIcon>,
      topZIndex: 100,
      gridSize: { x: 110, y: 120 }
    };
  },

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
    moveIcon(id: string, x: number, y: number) {
      const icon = this.desktopIcons[id];
      if (icon) {
        // Snap to grid
        icon.x = Math.round(x / this.gridSize.x) * this.gridSize.x + 20;
        icon.y = Math.round(y / this.gridSize.y) * this.gridSize.y + 20;
        
        // Save to local storage
        localStorage.setItem('nubeos_desktop_icons', JSON.stringify(this.desktopIcons));
      }
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
