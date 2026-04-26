<template>
  <v-card class="job-card">
    <div class="job-row px-4 py-3">
      <div class="d-flex align-center ga-3 flex-grow-1" style="min-width: 0">
        <v-avatar
          v-if="props.job.metadata?.songPictureUrl"
          size="40"
          rounded="lg"
        >
          <v-img :src="props.job.metadata.songPictureUrl + '100'" :alt="props.job.metadata.songName || 'Song'" />
        </v-avatar>
        <v-avatar v-else size="40" rounded="lg" color="grey-lighten-3">
          <v-icon :icon="props.job.sourceType === 'UploadedFile' ? 'mdi-file-music' : 'mdi-music-note'" color="grey" />
        </v-avatar>

        <div class="flex-grow-1" style="min-width: 0">
          <div class="d-flex align-center ga-2 flex-wrap">
            <span v-if="props.job.metadata?.songName" class="text-subtitle-2 font-weight-medium text-truncate">
              {{ props.job.metadata.songName }}
            </span>
            <span v-else class="text-subtitle-2 font-weight-medium text-truncate text-medium-emphasis">
              {{ props.job.sourceType === 'UploadedFile' ? 'Uploaded File' : 'BandLab Track' }}
            </span>
            <v-chip size="x-small" variant="outlined" :color="props.job.sourceType === 'UploadedFile' ? 'secondary' : 'primary'">
              {{ props.job.sourceType === 'UploadedFile' ? 'File' : 'Track' }}
            </v-chip>
          </div>

          <div class="d-flex align-center ga-2 text-caption text-medium-emphasis flex-wrap">
            <span v-if="props.job.metadata?.creatorName">by {{ props.job.metadata.creatorName }}</span>
            <span v-if="props.job.metadata?.creatorName && props.job.trackUrl">·</span>
            <a
              v-if="props.job.trackUrl"
              :href="props.job.trackUrl"
              target="_blank"
              rel="noopener"
              class="text-primary text-truncate"
              style="max-width: 320px"
            >
              {{ props.job.trackUrl }}
            </a>
            <span v-if="props.job.trackUrl">·</span>
            <span>{{ formatDate(props.job.createdAt) }}</span>
          </div>
        </div>
      </div>

      <div class="job-statuses d-flex align-center ga-2 flex-wrap">
        <div class="job-status-card">
          <span class="job-status-label">OpenAI</span>
          <StatusChip :status="props.job.openAi.status" />
        </div>
        <div class="job-status-card">
          <span class="job-status-label">Google</span>
          <StatusChip :status="props.job.googleChirp.status" />
        </div>
      </div>

      <div class="d-flex align-center ga-1 flex-shrink-0">
        <v-btn
          size="small"
          variant="tonal"
          color="primary"
          prepend-icon="mdi-eye-outline"
          @click="openDetails()"
        >
          Open
        </v-btn>

        <v-btn
          size="small"
          variant="text"
          color="error"
          prepend-icon="mdi-delete-outline"
          :loading="props.deleting"
          :disabled="props.deleting"
          @click="emit('remove', props.job.id)"
        >
          Delete
        </v-btn>
      </div>
    </div>

    <v-dialog v-model="detailsOpen" max-width="860">
      <v-card rounded="xl">
        <div class="d-flex align-center px-4 py-3 ga-3">
          <div class="flex-grow-1" style="min-width: 0">
            <div class="text-subtitle-1 font-weight-medium text-truncate">
              {{ dialogTitle }}
            </div>
            <div class="text-caption text-medium-emphasis d-flex align-center ga-2 flex-wrap">
              <span>{{ props.job.sourceType === 'UploadedFile' ? 'Uploaded file' : 'BandLab track' }}</span>
              <span>·</span>
              <span>{{ formatDate(props.job.createdAt) }}</span>
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="detailsOpen = false" />
        </div>

        <v-divider />

        <v-card-text class="pa-4">
          <v-row>
            <v-col cols="12" md="6">
              <v-sheet class="details-panel pa-4" border rounded="lg">
                <div class="d-flex align-center ga-2 mb-3">
                  <v-icon icon="mdi-robot" size="small" color="primary" />
                  <span class="text-subtitle-2 font-weight-medium">OpenAI Whisper</span>
                  <v-spacer />
                  <StatusChip :status="props.job.openAi.status" />
                </div>

                <p class="text-body-2 text-medium-emphasis mb-3">
                  {{ summaryText(props.job.openAi) }}
                </p>

                <v-progress-linear
                  v-if="isProcessing(props.job.openAi)"
                  indeterminate
                  color="info"
                  rounded
                  class="mb-4"
                />

                <video
                  v-if="props.job.openAi.status === 'Completed' && props.job.openAi.videoUrl"
                  :src="props.job.openAi.videoUrl"
                  controls
                  preload="metadata"
                  class="details-video mb-4"
                >
                  Your browser does not support the video tag.
                </video>

                <v-alert
                  v-if="props.job.openAi.status === 'Failed' && props.job.openAi.errorMessage"
                  type="error"
                  variant="tonal"
                  class="mb-4"
                >
                  {{ props.job.openAi.errorMessage }}
                </v-alert>

                <v-expansion-panels v-if="props.job.openAi.srtContent" variant="accordion" flat>
                  <v-expansion-panel>
                    <v-expansion-panel-title>View subtitles</v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <pre class="subtitle-content">{{ props.job.openAi.srtContent }}</pre>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-sheet>
            </v-col>

            <v-col cols="12" md="6">
              <v-sheet class="details-panel pa-4" border rounded="lg">
                <div class="d-flex align-center ga-2 mb-3">
                  <v-icon icon="mdi-google" size="small" color="secondary" />
                  <span class="text-subtitle-2 font-weight-medium">Google Chirp3</span>
                  <v-spacer />
                  <StatusChip :status="props.job.googleChirp.status" />
                </div>

                <p class="text-body-2 text-medium-emphasis mb-3">
                  {{ summaryText(props.job.googleChirp) }}
                </p>

                <v-progress-linear
                  v-if="isProcessing(props.job.googleChirp)"
                  indeterminate
                  color="info"
                  rounded
                  class="mb-4"
                />

                <video
                  v-if="props.job.googleChirp.status === 'Completed' && props.job.googleChirp.videoUrl"
                  :src="props.job.googleChirp.videoUrl"
                  controls
                  preload="metadata"
                  class="details-video mb-4"
                >
                  Your browser does not support the video tag.
                </video>

                <v-alert
                  v-if="props.job.googleChirp.status === 'Failed' && props.job.googleChirp.errorMessage"
                  type="error"
                  variant="tonal"
                  class="mb-4"
                >
                  {{ props.job.googleChirp.errorMessage }}
                </v-alert>

                <v-expansion-panels v-if="props.job.googleChirp.srtContent" variant="accordion" flat>
                  <v-expansion-panel>
                    <v-expansion-panel-title>View subtitles</v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <pre class="subtitle-content">{{ props.job.googleChirp.srtContent }}</pre>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-sheet>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { LyricsVideoJob, ProviderResult } from '@/types/lyricsVideo'
import StatusChip from './StatusChip.vue'

const props = defineProps<{
  job: LyricsVideoJob
  deleting?: boolean
}>()

const emit = defineEmits<{
  remove: [jobId: string]
}>()

const detailsOpen = ref(false)

const dialogTitle = computed(() => {
  return props.job.metadata?.songName
    || (props.job.sourceType === 'UploadedFile' ? 'Uploaded File' : 'BandLab Track')
})

function openDetails() {
  detailsOpen.value = true
}

function isProcessing(result: ProviderResult): boolean {
  return result.status === 'Transcribing' || result.status === 'GeneratingVideo'
}

function summaryText(result: ProviderResult): string {
  switch (result.status) {
    case 'Pending':
      return 'Queued and waiting to start'
    case 'Transcribing':
      return 'Extracting lyrics and syncing timing'
    case 'GeneratingVideo':
      return 'Rendering the final video output'
    case 'Completed':
      return 'Video is ready to preview'
    case 'Failed':
      return result.errorMessage || 'Generation failed'
    default:
      return ''
  }
}

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

<style scoped>
.job-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.job-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 16px;
}

.job-statuses {
  justify-content: flex-end;
}

.job-status-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-width: 118px;
  padding: 8px 10px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  background: rgba(var(--v-theme-surface), 1);
}

.job-status-label {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-weight: 600;
}

.details-panel {
  height: 100%;
}

.details-video {
  width: 100%;
  max-height: 60vh;
  border-radius: 16px;
  background: #000;
}

.subtitle-content {
  white-space: pre-wrap;
  max-height: 220px;
  overflow-y: auto;
  font-size: 12px;
}

@media (max-width: 960px) {
  .job-row {
    grid-template-columns: 1fr;
  }

  .job-statuses {
    justify-content: flex-start;
  }
}
</style>
