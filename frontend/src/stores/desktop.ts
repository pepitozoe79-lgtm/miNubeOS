import { defineStore } from 'pinia';

export type WindowApp = 'files' | 'apps' | 'admin' | 'settings' | 'monitor' | 'terminal' | 'player' | 'entertainment';

export interface WindowState {
  id: WindowApp;
  title: string;
  isOpen: boolean;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DesktopIcon {
  id: string;
  label: string;
  icon: string;
  color: 'blue' | 'purple' | 'green' | 'grey' | 'orange' | 'dark' | 'red';
  x: number;
  y: number;
  type?: 'app' | 'drive';
  path?: string;
}

export const useDesktopStore = defineStore('desktop', {
  state: () => {
    // Load persisted icon positions or use defaults
    const savedIcons = localStorage.getItem('nubeos_desktop_icons');
    const defaultIcons: Record<string, DesktopIcon> = {
      files: { id: 'files', label: 'Archivos', icon: 'Folder', color: 'blue', x: 20, y: 20 },
      apps: { id: 'apps', label: 'App Center', icon: 'LayoutDashboard', color: 'purple', x: 130, y: 20 },
      monitor: { id: 'monitor', label: 'Monitor', icon: 'Activity', color: 'green', x: 20, y: 260 },
      admin: { id: 'admin', label: 'Panel Control', icon: 'Settings', color: 'grey', x: 20, y: 380 },
      terminal: { id: 'terminal', label: 'Terminal', icon: 'Terminal', color: 'dark', x: 20, y: 500 },
      entertainment: { id: 'entertainment', label: 'EntertainmentOS', icon: 'Clapperboard', color: 'red', x: 130, y: 140 },
    };

    return {
      wallpaper: localStorage.getItem('nubeos_wallpaper') || '/wallpapers/wp0.png',
      windows: {
        files: { id: 'files', title: 'Explorador de Archivos', isOpen: false, zIndex: 10, isMinimized: false, isMaximized: false, x: -1, y: -1, width: 900, height: 600 },
        apps: { id: 'apps', title: 'Centro de Aplicaciones', isOpen: false, zIndex: 10, isMinimized: false, isMaximized: false, x: -1, y: -1, width: 800, height: 500 },
        admin: { id: 'admin', title: 'Panel de Control', isOpen: false, zIndex: 10, isMinimized: false, isMaximized: false, x: -1, y: -1, width: 900, height: 650 },
        settings: { id: 'settings', title: 'Configuración', isOpen: false, zIndex: 10, isMinimized: false, isMaximized: false, x: -1, y: -1, width: 600, height: 500 },
        monitor: { id: 'monitor', title: 'Monitor del Sistema', isOpen: false, zIndex: 10, isMinimized: false, isMaximized: false, x: -1, y: -1, width: 700, height: 500 },
        terminal: { id: 'terminal', title: 'Terminal', isOpen: false, zIndex: 10, isMinimized: false, isMaximized: false, x: -1, y: -1, width: 800, height: 500 },
        player: { id: 'player', title: 'Reproductor de Video', isOpen: false, zIndex: 10, isMinimized: false, isMaximized: false, x: -1, y: -1, width: 800, height: 480 },
        entertainment: { id: 'entertainment', title: 'EntertainmentOS', isOpen: false, zIndex: 10, isMinimized: false, isMaximized: false, x: -1, y: -1, width: 1100, height: 700 },
      } as Record<WindowApp, WindowState>,
      currentVideo: '',
      currentMediaId: null as number | null,
      currentMediaTitle: '',
      currentMediaSeconds: 0,
      desktopIcons: { ...defaultIcons, ...(savedIcons ? JSON.parse(savedIcons) : {}) } as Record<string, DesktopIcon>,
      dynamicIcons: {} as Record<string, DesktopIcon>,
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
        win.x = Math.max(0, (window.innerWidth - win.width) / 2);
        win.y = Math.max(0, (window.innerHeight - win.height) / 2);
      }
      this.focusWindow(app);
    },
    toggleWindow(app: WindowApp) {
      if (this.windows[app].isOpen) {
        this.closeWindow(app);
      } else {
        this.openWindow(app);
      }
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
    resizeWindow(app: WindowApp, width: number, height: number) {
      this.windows[app].width = width;
      this.windows[app].height = height;
    },
    moveIcon(id: string, x: number, y: number) {
      const icon = this.desktopIcons[id] || this.dynamicIcons[id];
      if (icon) {
        // Snap to grid
        icon.x = Math.round(x / this.gridSize.x) * this.gridSize.x + 20;
        icon.y = Math.round(y / this.gridSize.y) * this.gridSize.y + 20;
        
        // Save to local storage only if it's a permanent icon
        if (this.desktopIcons[id]) {
          localStorage.setItem('nubeos_desktop_icons', JSON.stringify(this.desktopIcons));
        }
      }
    },
    focusWindow(app: WindowApp) {
      this.topZIndex++;
      this.windows[app].zIndex = this.topZIndex;
    },
    setWallpaper(url: string) {
      this.wallpaper = url;
      localStorage.setItem('nubeos_wallpaper', url);
    },
    setDynamicIcons(icons: DesktopIcon[]) {
      const newIcons: Record<string, DesktopIcon> = {};
      icons.forEach(icon => {
        newIcons[icon.id] = icon;
      });
      this.dynamicIcons = newIcons;
    },
    playVideo(url: string, title?: string, mediaId?: number, mediaSeconds?: number) {
      this.currentVideo = url;
      this.currentMediaId = mediaId || null;
      this.currentMediaTitle = title || '';
      this.currentMediaSeconds = mediaSeconds || 0;
      if (title) this.windows.player.title = `Reproductor: ${title}`;
      this.openWindow('player');
    }
  }
});
