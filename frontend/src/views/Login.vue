<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { LogIn } from 'lucide-vue-next';

const auth = useAuthStore();
const router = useRouter();

const username = ref('');
const password = ref('');

const handleLogin = async () => {
  const success = await auth.login(username.value, password.value);
  if (success) {
    router.push('/');
  }
};

// Error: using .ref.value on a regular ref is wrong, fixed it below
</script>

<template>
  <div class="login-container">
    <div class="glass login-card fade-in">
      <div class="header">
        <div class="logo-box">
          <img src="../assets/logo.png" alt="NubeOS Logo" class="login-logo" />
        </div>
        <h1>NubeOS</h1>
        <p>Tu nube personal, simplificada.</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <label>Usuario</label>
          <input 
            v-model="username" 
            type="text" 
            placeholder="Introduce tu usuario"
            required
          />
        </div>
        
        <div class="input-group">
          <label>Contraseña</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="••••••••"
            required
          />
        </div>

        <div v-if="auth.error" class="error-msg">
          {{ auth.error }}
        </div>

        <button :disabled="auth.loading" type="submit" class="btn-primary">
          <LogIn v-if="!auth.loading" :size="20" />
          <span>{{ auth.loading ? 'Iniciando sesión...' : 'Entrar' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
  background: radial-gradient(circle at top right, #1e1b4b, #0f172a);
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 2.5rem;
  text-align: center;
}

.header {
  margin-bottom: 2rem;
}

.logo-box {
  width: 96px;
  height: 96px;
  margin: 0 auto 1.5rem;
}

.login-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 8px 16px rgba(0,0,0,0.3));
}

h1 {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  background: linear-gradient(to right, #fff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

p {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  text-align: left;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-muted);
}

.btn-primary {
  background: var(--primary);
  color: white;
  padding: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-size: 1rem;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-msg {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #f87171;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
  text-align: center;
}
</style>
