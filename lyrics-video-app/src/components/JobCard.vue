<template>
  <v-card>
    <!-- Card Header -->
    <v-card-title class="d-flex align-center py-3 px-4">
      <v-icon class="mr-2" size="small" color="primary">mdi-music-note</v-icon>
      <a
        :href="job.trackUrl"
        target="_blank"
        rel="noopener"
        class="text-body-2 text-primary text-truncate"
        style="max-width: 500px"
      >
        {{ job.trackUrl }}
      </a>
      <v-spacer />
      <v-chip size="x-small" variant="text" class="text-caption text-medium-emphasis">
        {{ formatDate(job.createdAt) }}
      </v-chip>
    </v-card-title>

    <v-divider />

    <!-- Two Provider Columns -->
    <v-card-text class="pa-0">
      <v-row no-gutters>
        <!-- OpenAI Column -->
        <v-col cols="12" md="6" class="pa-4" style="border-right: 1px solid rgb(var(--v-theme-on-surface), 0.08)">
          <ProviderSection
            provider="OpenAI Whisper"
            icon="mdi-robot"
            :result="job.openAi"
          />
        </v-col>

        <!-- Google Chirp Column -->
        <v-col cols="12" md="6" class="pa-4">
          <ProviderSection
            provider="Google Chirp3"
            icon="mdi-google"
            :result="job.googleChirp"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { LyricsVideoJob } from '@/types/lyricsVideo'
import ProviderSection from './ProviderSection.vue'

defineProps<{
  job: LyricsVideoJob
}>()

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>
