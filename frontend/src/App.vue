<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';

const auth = useAuthStore();

onMounted(() => {
  auth.init();
});
</script>

<template>
  <router-view></router-view>
</template>

<style>
/* Global styles in style.css */
</style>
