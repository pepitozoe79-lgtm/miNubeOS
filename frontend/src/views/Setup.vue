<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { UserPlus, ShieldCheck, Rocket, Lock, User, Check } from 'lucide-vue-next';

const auth = useAuthStore();
const router = useRouter();

const username = ref('admin');
const password = ref('');
const confirmPassword = ref('');
const step = ref(1);
const canvasRef = ref<HTMLCanvasElement | null>(null);

// Particle system (Same as login for consistency)
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
    star.y -= star.speed;
    if (star.y < 0) star.y = height;
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

const handleSetup = async () => {
  if (password.value !== confirmPassword.value) {
    auth.error = 'Las contraseñas no coinciden';
    return;
  }
  
  const success = await auth.setupAdmin(username.value, password.value);
  if (success) {
    step.value = 3;
  }
};

const goToDashboard = () => {
  router.push('/');
};
</script>

<template>
  <div class="setup-wrapper">
    <canvas ref="canvasRef" class="space-canvas"></canvas>
    
    <div class="split-card fade-in">
      <!-- Left Panel: Branding -->
      <div class="panel-left">
        <div class="welcome-section">
          <p class="welcome-text">Configuración Inicial</p>
          <div class="logo-container">
            <img src="../assets/logo.png" alt="NubeOS" class="brand-logo" />
            <h2 class="brand-name">NubeOS</h2>
          </div>
          <p class="brand-description">
            Bienvenido. Detectamos que es tu primera vez aquí. Vamos a crear la cuenta maestra para tu nube.
          </p>
        </div>
        
        <div class="wavy-edge">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,0 C20,20 20,80 0,100 L100,100 L100,0 Z" fill="white" />
          </svg>
        </div>

        <div class="footer-note">Seguridad Protegida por NubeOS Core</div>
      </div>

      <!-- Right Panel: Setup Steps -->
      <div class="panel-right">
        <div class="form-container">
          <!-- Step 3: Success -->
          <div v-if="step === 3" class="success-view">
            <div class="icon-blob success">
              <Rocket :size="48" />
            </div>
            <h3>¡Todo listo!</h3>
            <p>Tu cuenta de administrador ha sido configurada correctamente.</p>
            <button @click="goToDashboard" class="btn-primary full-width">
              Acceder al Dashboard
            </button>
          </div>

          <!-- Step 1 & 2: Form -->
          <div v-else>
            <h3 class="form-title">Crea tu administrador</h3>
            <form @submit.prevent="handleSetup" class="setup-form">
              <div class="input-group">
                <label>Usuario Maestro</label>
                <div class="input-ctrl">
                  <User :size="16" class="ctrl-icon" />
                  <input v-model="username" type="text" placeholder="Ej. admin" required />
                </div>
              </div>

              <div class="input-group">
                <label>Contraseña Maestra</label>
                <div class="input-ctrl">
                  <Lock :size="16" class="ctrl-icon" />
                  <input v-model="password" type="password" placeholder="Mínimo 8 caracteres" required />
                </div>
              </div>

              <div class="input-group">
                <label>Confirmar Contraseña</label>
                <div class="input-ctrl">
                  <Lock :size="16" class="ctrl-icon" />
                  <input v-model="confirmPassword" type="password" placeholder="Repite la contraseña" required />
                </div>
              </div>

              <div v-if="auth.error" class="error-msg">
                {{ auth.error }}
              </div>

              <div class="form-actions">
                <button :disabled="auth.loading" type="submit" class="btn-primary">
                  <span v-if="!auth.loading" class="btn-flex">
                    Siguiente
                    <Check :size="18" />
                  </span>
                  <span v-else>Configurando...</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.setup-wrapper {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #020617;
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
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
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
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: #818cf8;
  margin-bottom: 1.5rem;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.brand-logo {
  width: 140px;
  height: auto;
  filter: drop-shadow(0 0 30px rgba(99, 102, 241, 0.4));
}

.brand-name {
  font-size: 2.8rem;
  font-weight: 900;
  letter-spacing: -0.05em;
}

.brand-description {
  font-size: 0.95rem;
  line-height: 1.6;
  opacity: 0.7;
  max-width: 300px;
  margin: 1rem auto 0;
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

.footer-note {
  position: absolute;
  bottom: 2rem;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  opacity: 0.4;
  text-transform: uppercase;
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
  max-width: 340px;
}

.form-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 2.5rem;
  text-align: center;
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.input-ctrl {
  position: relative;
  display: flex;
  align-items: center;
}

.ctrl-icon {
  position: absolute;
  left: 0;
  color: #94a3b8;
}

.input-ctrl input {
  width: 100%;
  border: none;
  border-bottom: 2px solid #f1f5f9;
  padding: 0.6rem 0 0.6rem 2rem;
  font-size: 1rem;
  color: #0f172a;
  background: transparent;
  transition: all 0.3s;
}

.input-ctrl input:focus {
  outline: none;
  border-bottom-color: #4f46e5;
}

.btn-primary {
  width: 100%;
  background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
  color: white;
  border: none;
  border-radius: 16px;
  padding: 1rem;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.4);
  transition: all 0.3s;
  margin-top: 1rem;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px -10px rgba(79, 70, 229, 0.6);
}

.btn-flex {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.error-msg {
  background: #fef2f2;
  border: 1px solid #fee2e2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  text-align: center;
}

/* Success View */
.success-view {
  text-align: center;
}

.icon-blob {
  width: 100px;
  height: 100px;
  background: #f0fdf4;
  color: #16a34a;
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem;
  animation: blobMorph 5s linear infinite;
}

@keyframes blobMorph {
  0%, 100% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; }
  50% { border-radius: 50% 50% 33% 67% / 55% 27% 73% 45%; }
}

.success-view h3 {
  font-size: 1.8rem;
  font-weight: 800;
  color: #16a34a;
  margin-bottom: 1rem;
}

.success-view p {
  color: #64748b;
  font-size: 1rem;
  margin-bottom: 2rem;
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
