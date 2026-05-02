<template>
  <v-app class="app-shell">
    <v-app-bar color="primary" density="comfortable" class="app-bar">
      <div class="app-bar-content">
        <v-app-bar-title class="app-title">
          <v-icon class="mr-2">mdi-music-note</v-icon>
          Lyrics Video Generator
        </v-app-bar-title>

        <div class="app-nav">
          <v-btn
            :to="{ name: 'home' }"
            :variant="route.name === 'home' ? 'flat' : 'text'"
            :color="route.name === 'home' ? 'surface' : undefined"
            rounded="pill"
          >
            Videos
          </v-btn>
          <v-btn
            :to="{ name: 'insights' }"
            :variant="route.name === 'insights' ? 'flat' : 'text'"
            :color="route.name === 'insights' ? 'surface' : undefined"
            rounded="pill"
            prepend-icon="mdi-chart-box-outline"
          >
            Insights
          </v-btn>
        </div>

        <div class="app-bar-spacer" aria-hidden="true"></div>
      </div>
    </v-app-bar>

    <v-main class="app-main">
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped>
.app-shell {
  background: rgb(var(--v-theme-background));
}

.app-main {
  min-height: 100vh;
}

.app-bar-content {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 16px;
}

.app-title {
  min-width: 0;
}

.app-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-self: center;
}

@media (max-width: 720px) {
  .app-bar-content {
    gap: 8px;
  }

  .app-nav {
    gap: 4px;
  }
}
</style>
