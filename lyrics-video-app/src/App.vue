<template>
  <v-app class="app-shell">
    <v-app-bar color="primary" density="comfortable">
      <v-app-bar-title>
        <v-icon class="mr-2">mdi-music-note</v-icon>
        Lyrics Video Generator
      </v-app-bar-title>
    </v-app-bar>

    <v-main class="app-main">
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
</script>

<style scoped>
.app-shell {
  background:
    radial-gradient(circle at top, rgba(var(--v-theme-primary), 0.16) 0%, transparent 38%),
    linear-gradient(180deg, rgba(var(--v-theme-background), 1) 0%, rgba(var(--v-theme-surface), 0.94) 100%);
}

.app-main {
  min-height: 100vh;
}
</style>
