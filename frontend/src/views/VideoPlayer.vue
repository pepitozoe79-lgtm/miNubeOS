<template>
  <div class="video-player-container">
    <video 
      ref="videoRef" 
      :src="desktop.currentVideo" 
      controls 
      autoplay 
      class="native-video"
      @timeupdate="handleTimeUpdate"
      @ended="handleEnded"
    ></video>
    <div v-if="!desktop.currentVideo" class="no-video">
      <Film :size="48" />
      <p>Selecciona un video para reproducir</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch } from 'vue';
import { useDesktopStore } from '../stores/desktop';
import { Film } from 'lucide-vue-next';
import axios from 'axios';

const desktop = useDesktopStore();
const videoRef = ref<HTMLVideoElement | null>(null);
const lastSavedTime = ref(0);

const saveProgress = async (isFinished = false) => {
  if (!desktop.currentMediaId || !videoRef.value) return;
  
  const currentTime = Math.floor(videoRef.value.currentTime);
  // Avoid saving if time hasn't changed much (unless finished)
  if (!isFinished && Math.abs(currentTime - lastSavedTime.value) < 5) return;

  try {
    await axios.post('/api/entertainment/progress', {
      mediaId: desktop.currentMediaId,
      seconds: currentTime,
      isFinished
    });
    lastSavedTime.value = currentTime;
  } catch (err) {
    console.error('Failed to save watch progress:', err);
  }
};

const handleTimeUpdate = () => {
  saveProgress();
};

const handleEnded = () => {
  saveProgress(true);
};

// Reset video when currentVideo changes to ensure it plays
watch(() => desktop.currentVideo, () => {
  if (videoRef.value) {
    videoRef.value.load();
    const startTime = desktop.currentMediaSeconds || 0;
    
    videoRef.value.onloadedmetadata = () => {
      if (videoRef.value && startTime > 0) {
        videoRef.value.currentTime = startTime;
      }
    };

    videoRef.value.play().catch(e => console.warn('Autoplay blocked or failed:', e));
    lastSavedTime.value = startTime;
  }
});

onUnmounted(() => {
  if (videoRef.value) {
    saveProgress(); // Final save on close
    videoRef.value.pause();
    videoRef.value.src = "";
    videoRef.value.load();
  }
});
</script>

<style scoped>
.video-player-container {
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.native-video {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  outline: none;
}

.no-video {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #475569;
}

.no-video p {
  font-size: 0.9rem;
  font-weight: 500;
}
</style>
