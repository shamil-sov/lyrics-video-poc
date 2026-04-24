<template>
  <v-card>
    <!-- Card Header -->
    <div class="d-flex align-center py-3 px-4">
      <!-- Song picture -->
      <v-avatar
        v-if="job.metadata?.songPictureUrl"
        size="40"
        rounded="lg"
        class="mr-3"
      >
        <v-img :src="job.metadata.songPictureUrl + '100'" :alt="job.metadata.songName || 'Song'" />
      </v-avatar>
      <v-avatar v-else size="40" rounded="lg" color="grey-lighten-3" class="mr-3">
        <v-icon :icon="job.sourceType === 'UploadedFile' ? 'mdi-file-music' : 'mdi-music-note'" color="grey" />
      </v-avatar>

      <!-- Song info -->
      <div class="flex-grow-1" style="min-width: 0">
        <div class="d-flex align-center ga-2">
          <span v-if="job.metadata?.songName" class="text-subtitle-2 font-weight-medium text-truncate">
            {{ job.metadata.songName }}
          </span>
          <span v-else class="text-subtitle-2 font-weight-medium text-truncate text-medium-emphasis">
            {{ job.sourceType === 'UploadedFile' ? 'Uploaded File' : 'BandLab Track' }}
          </span>
          <v-chip size="x-small" variant="outlined" :color="job.sourceType === 'UploadedFile' ? 'secondary' : 'primary'" class="flex-shrink-0">
            {{ job.sourceType === 'UploadedFile' ? 'File' : 'Track' }}
          </v-chip>
        </div>
        <div class="d-flex align-center ga-2 text-caption text-medium-emphasis">
          <span v-if="job.metadata?.creatorName">by {{ job.metadata.creatorName }}</span>
          <span v-if="job.metadata?.creatorName && job.trackUrl">·</span>
          <a
            v-if="job.trackUrl"
            :href="job.trackUrl"
            target="_blank"
            rel="noopener"
            class="text-primary text-truncate"
            style="max-width: 350px"
          >
            {{ job.trackUrl }}
          </a>
        </div>
      </div>

      <v-chip size="x-small" variant="text" class="text-caption text-medium-emphasis flex-shrink-0">
        {{ formatDate(job.createdAt) }}
      </v-chip>
    </div>

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
