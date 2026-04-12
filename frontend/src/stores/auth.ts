import { defineStore } from 'pinia';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  role: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('nubeos_token') || null,
    user: JSON.parse(localStorage.getItem('nubeos_user') || 'null') as User | null,
    loading: false,
    error: null as string | null,
    cachedIsConfigured: null as boolean | null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
  },

  actions: {
    async login(username: string, password: string) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.post('/api/auth/login', { username, password });
        this.token = response.data.token;
        this.user = response.data.user;
        this.cachedIsConfigured = true;
        
        localStorage.setItem('nubeos_token', this.token!);
        localStorage.setItem('nubeos_user', JSON.stringify(this.user));
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        return true;
      } catch (err: any) {
        this.error = err.response?.data?.error || 'Error al iniciar sesión';
        return false;
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('nubeos_token');
      localStorage.removeItem('nubeos_user');
      delete axios.defaults.headers.common['Authorization'];
    },

    init() {
      if (this.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      }
    },

    async checkSetup() {
      if (this.cachedIsConfigured) return true;
      try {
        const response = await axios.get('/api/auth/status');
        this.cachedIsConfigured = response.data.isConfigured;
        return this.cachedIsConfigured;
      } catch (err) {
        console.warn('No se pudo verificar el estado de configuración (posiblemente el backend esté iniciando):', err);
        return false; // Cambiado a false: si hay error, mejor mostrar el asistente
      }
    },

    async setupAdmin(username: string, password: string) {
      this.loading = true;
      this.error = null;
      try {
        await axios.post('/api/auth/setup', { username, password });
        this.cachedIsConfigured = true;
        return await this.login(username, password);
      } catch (err: any) {
        this.error = err.response?.data?.error || 'Error al configurar el administrador';
        return false;
      } finally {
        this.loading = false;
      }
    }
  }
});
