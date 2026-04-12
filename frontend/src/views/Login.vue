<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { LogIn, User, Lock, Check } from 'lucide-vue-next';

const auth = useAuthStore();
const router = useRouter();

const username = ref('');
const password = ref('');
const canvasRef = ref<HTMLCanvasElement | null>(null);

// Particle system
let ctx: CanvasRenderingContext2D | null = null;
let stars: any[] = [];
let mouse = { x: 0, y: 0 };
let animationFrameId: number;

const initStars = (width: number, height: number) => {
  stars = [];
  const starCount = 120;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2,
      opacity: Math.random() * 0.8,
      speed: Math.random() * 0.4 + 0.1
    });
  }
};

const draw = () => {
  if (!ctx || !canvasRef.value) return;
  const { width, height } = canvasRef.value;
  ctx.clearRect(0, 0, width, height);
  stars.forEach(star => {
    const offsetX = (mouse.x - width / 2) * star.speed * 0.05;
    const offsetY = (mouse.y - height / 2) * star.speed * 0.05;
    ctx!.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
    ctx!.beginPath();
    ctx!.arc(star.x + offsetX, star.y + offsetY, star.size, 0, Math.PI * 2);
    ctx!.fill();
    star.opacity += (Math.random() - 0.5) * 0.02;
    if (star.opacity < 0.1) star.opacity = 0.1;
    if (star.opacity > 0.8) star.opacity = 0.8;
  });
  animationFrameId = requestAnimationFrame(draw);
};

const handleMouseMove = (e: MouseEvent) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
};

const handleResize = () => {
  if (canvasRef.value) {
    canvasRef.value.width = window.innerWidth;
    canvasRef.value.height = window.innerHeight;
    initStars(canvasRef.value.width, canvasRef.value.height);
  }
};

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d');
    handleResize();
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    draw();
  }
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('resize', handleResize);
  cancelAnimationFrame(animationFrameId);
});

const handleLogin = async () => {
  const success = await auth.login(username.value, password.value);
  if (success) {
    router.push('/');
  }
};
</script>

<template>
  <div class="login-wrapper">
    <canvas ref="canvasRef" class="space-canvas"></canvas>
    
    <div class="split-card fade-in">
      <!-- Left Panel: Brand & Welcome -->
      <div class="panel-left">
        <div class="welcome-section">
          <p class="welcome-text">Bienvenido a</p>
          <div class="logo-container">
            <img src="../assets/logo.png" alt="NubeOS" class="brand-logo" />
            <h2 class="brand-name">NubeOS</h2>
          </div>
          <p class="brand-description">
            Tu nube personal inteligente, diseñada para la máxima velocidad y seguridad.
          </p>
        </div>
        
        <!-- Wavy Divider Asset (Clouds look) -->
        <div class="wavy-edge">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,0 C20,20 20,80 0,100 L100,100 L100,0 Z" fill="white" />
            <path d="M0,0 C10,25 10,75 0,100" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2" />
          </svg>
        </div>
        
        <div class="credits">
          CREATOR <strong>NUBE</strong> | DESIGNER <strong>AI</strong>
        </div>
      </div>

      <!-- Right Panel: Login Form -->
      <div class="panel-right">
        <div class="form-container">
          <h3 class="form-title">Inicia sesión</h3>
          
          <form @submit.prevent="handleLogin" class="auth-form">
            <div class="input-group">
              <label>Usuario</label>
              <div class="input-ctrl">
                <input v-model="username" type="text" placeholder="Tu nombre de usuario" required />
                <Check v-if="username.length > 3" class="valid-icon" :size="16" />
              </div>
            </div>

            <div class="input-group">
              <label>Contraseña</label>
              <div class="input-ctrl">
                <input v-model="password" type="password" placeholder="Tu contraseña" required />
                <Check v-if="password.length > 5" class="valid-icon" :size="16" />
              </div>
            </div>

            <div v-if="auth.error" class="error-bubble">
              {{ auth.error }}
            </div>

            <div class="form-actions">
              <button :disabled="auth.loading" type="submit" class="btn-primary">
                {{ auth.loading ? 'Cargando...' : 'Acceder' }}
              </button>
              <button type="button" class="btn-secondary">Registrarse</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-wrapper {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111827; 
  overflow: hidden;
}

.space-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.split-card {
  position: relative;
  z-index: 10;
  width: 900px;
  height: 600px;
  background: white;
  border-radius: 40px;
  display: flex;
  overflow: hidden;
  box-shadow: 0 50px 100px -20px rgba(0,0,0,0.5);
}

/* Left Panel */
.panel-left {
  flex: 1.2;
  background: linear-gradient(135deg, #0958d9 0%, #1677ff 100%);
  position: relative;
  padding: 4rem;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.welcome-section {
  position: relative;
  z-index: 2;
  text-align: center;
}

.welcome-text {
  font-size: 1.2rem;
  font-weight: 500;
  opacity: 0.9;
  margin-bottom: 1rem;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.brand-logo {
  width: 120px; /* Adjusted to fit the split view better */
  height: auto;
  filter: drop-shadow(0 0 20px rgba(255,255,255,0.3));
}

.brand-name {
  font-size: 2.5rem;
  font-weight: 800;
}

.brand-description {
  font-size: 0.9rem;
  line-height: 1.6;
  opacity: 0.8;
  max-width: 280px;
  margin: 0 auto;
}

.wavy-edge {
  position: absolute;
  top: 0;
  right: -1px;
  height: 100%;
  width: 120px;
  z-index: 1;
}

.wavy-edge svg {
  width: 100%;
  height: 100%;
}

.credits {
  position: absolute;
  bottom: 2rem;
  left: 4rem;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  opacity: 0.7;
}

/* Right Panel */
.panel-right {
  flex: 1;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem;
}

.form-container {
  width: 100%;
  max-width: 320px;
}

.form-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 2.5rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #4b5563;
}

.input-ctrl {
  position: relative;
  display: flex;
  align-items: center;
}

.input-ctrl input {
  width: 100%;
  border: none;
  border-bottom: 2px solid #e5e7eb;
  padding: 0.5rem 0;
  font-size: 1rem;
  color: #111827;
  background: transparent;
  transition: border-color 0.3s;
}

.input-ctrl input:focus {
  outline: none;
  border-bottom-color: #1677ff;
}

.input-ctrl input::placeholder {
  color: #9ca3af;
  font-size: 0.9rem;
}

.valid-icon {
  position: absolute;
  right: 0;
  color: #52c41a;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-primary {
  flex: 1.5;
  background: linear-gradient(to right, #0958d9, #1677ff);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(22, 119, 255, 0.4);
  transition: all 0.3s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(22, 119, 255, 0.5);
}

.btn-secondary {
  flex: 1;
  background: white;
  color: #9ca3af;
  border: 2px solid #e5e7eb;
  border-radius: 50px;
  padding: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  border-color: #9ca3af;
  color: #4b5563;
}

.error-bubble {
  background: #fff1f0;
  border: 1px solid #ffa39e;
  color: #cf1322;
  padding: 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  text-align: center;
}

@media (max-width: 950px) {
  .split-card {
    width: 95%;
    flex-direction: column;
    height: auto;
  }
  .panel-left {
    padding: 3rem 1.5rem;
  }
  .wavy-edge {
    display: none;
  }
}
</style>
