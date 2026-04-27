<template>
  <v-card class="job-card">
    <div class="job-row px-4 py-3">
      <div class="job-main d-flex ga-3 flex-grow-1" style="min-width: 0">
        <v-avatar
          v-if="props.job.metadata?.songPictureUrl"
          size="52"
          rounded="lg"
          class="job-avatar"
        >
          <v-img :src="props.job.metadata.songPictureUrl + '100'" :alt="props.job.metadata.songName || 'Song'" />
        </v-avatar>
        <v-avatar v-else size="52" rounded="lg" color="grey-lighten-3" class="job-avatar">
          <v-icon :icon="props.job.sourceType === 'UploadedFile' ? 'mdi-file-music' : 'mdi-music-note'" color="grey" />
        </v-avatar>

        <div class="flex-grow-1" style="min-width: 0">
          <div class="d-flex align-center ga-2 flex-wrap mb-2">
            <v-chip
              size="x-small"
              variant="flat"
              :prepend-icon="sourceIcon"
              class="job-source-chip"
            >
              {{ sourceLabel }}
            </v-chip>
          </div>

          <div class="d-flex align-center ga-2 flex-wrap mb-1">
            <span v-if="props.job.metadata?.songName" class="job-title text-truncate">
              {{ props.job.metadata.songName }}
            </span>
            <span v-else class="job-title text-medium-emphasis text-truncate">
              {{ sourceLabel }}
            </span>
          </div>

          <div class="d-flex align-center ga-2 flex-wrap job-subline job-creator-line">
            <template v-if="props.job.metadata?.creatorName">
              <v-icon icon="mdi-account-circle-outline" size="x-small" />
              <span class="job-creator-name">{{ props.job.metadata.creatorName }}</span>
            </template>
            <span v-else class="job-creator-name">Lyrics video job</span>
          </div>

          <div class="d-flex align-center ga-2 flex-wrap mt-1 job-submitted-line">
            <v-icon icon="mdi-clock-outline" size="x-small" />
            <span class="job-submitted-text">Submitted on {{ formatDate(props.job.createdAt) }}</span>
          </div>

          <div v-if="props.job.trackUrl" class="d-flex align-center ga-2 flex-wrap mt-2">
            <a
              :href="props.job.trackUrl"
              target="_blank"
              rel="noopener"
              class="job-link-pill"
            >
              Track link
            </a>
          </div>
        </div>
      </div>

      <div class="job-statuses d-flex align-center ga-2 flex-wrap">
        <div class="job-status-card">
          <span class="job-status-label">OpenAI</span>
          <StatusChip :status="props.job.openAi.status" />
          <div v-if="props.job.openAi.timings?.totalMs != null" class="job-status-time-pill">
            <v-icon icon="mdi-timer-outline" size="x-small" />
            <span>{{ formatTiming(props.job.openAi.timings?.totalMs) }}</span>
          </div>
        </div>
        <div class="job-status-card">
          <span class="job-status-label">Google</span>
          <StatusChip :status="props.job.googleChirp.status" />
          <div v-if="props.job.googleChirp.timings?.totalMs != null" class="job-status-time-pill">
            <v-icon icon="mdi-timer-outline" size="x-small" />
            <span>{{ formatTiming(props.job.googleChirp.timings?.totalMs) }}</span>
          </div>
        </div>
      </div>

      <div class="job-actions d-flex ga-1 flex-shrink-0">
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

    <v-dialog v-model="detailsOpen" max-width="1040">
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

        <div class="px-4 pt-3 details-tab-bar">
          <v-btn
            class="details-tab-button"
            :class="{ 'details-tab-button--active': detailsTab === 'openAi' }"
            :variant="detailsTab === 'openAi' ? 'flat' : 'text'"
            :color="detailsTab === 'openAi' ? 'primary' : undefined"
            prepend-icon="mdi-robot"
            @click="detailsTab = 'openAi'"
          >
            OpenAI
          </v-btn>

          <v-btn
            class="details-tab-button"
            :class="{ 'details-tab-button--active': detailsTab === 'google' }"
            :variant="detailsTab === 'google' ? 'flat' : 'text'"
            :color="detailsTab === 'google' ? 'primary' : undefined"
            prepend-icon="mdi-google"
            @click="detailsTab = 'google'"
          >
            Google
          </v-btn>
        </div>

        <v-card-text class="pa-5 details-body">
          <v-window v-model="detailsTab" class="details-window">
            <v-window-item value="openAi">
              <v-sheet class="details-panel pa-5" border rounded="xl">
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

                <v-sheet
                  v-if="hasTimings(props.job.openAi)"
                  class="timings-panel mb-4 pa-3"
                  border
                  rounded="lg"
                >
                  <div class="d-flex align-center ga-2 mb-2">
                    <v-icon icon="mdi-timer-outline" size="small" color="primary" />
                    <span class="text-body-2 font-weight-medium">Timing breakdown</span>
                  </div>

                  <div class="timings-grid">
                    <div class="timings-stat">
                      <span class="timings-stat__label">Total</span>
                      <span class="timings-stat__value">{{ formatTiming(props.job.openAi.timings?.totalMs) }}</span>
                    </div>
                    <div class="timings-stat">
                      <span class="timings-stat__label">Transcription</span>
                      <span class="timings-stat__value">{{ formatTiming(props.job.openAi.timings?.transcriptionMs) }}</span>
                    </div>
                    <div class="timings-stat">
                      <span class="timings-stat__label">FFmpeg</span>
                      <span class="timings-stat__value">{{ formatTiming(props.job.openAi.timings?.ffmpegMs) }}</span>
                    </div>
                    <div class="timings-stat">
                      <span class="timings-stat__label">Remaining</span>
                      <span class="timings-stat__value">{{ formatTiming(remainingTiming(props.job.openAi.timings)) }}</span>
                    </div>
                  </div>
                </v-sheet>

                <div
                  v-if="props.job.openAi.videoUrl || props.job.openAi.srtContent"
                  class="mb-4 details-media-layout"
                  :class="{ 'details-media-layout--split': props.job.openAi.videoUrl && props.job.openAi.srtContent }"
                >
                  <div v-if="props.job.openAi.videoUrl" class="details-media-video">
                    <video
                      :src="props.job.openAi.videoUrl"
                      controls
                      preload="metadata"
                      class="details-video"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>

                  <v-sheet v-if="props.job.openAi.srtContent" class="subtitle-panel pa-3" border rounded="lg">
                    <div class="d-flex align-center ga-2 mb-2">
                      <v-icon icon="mdi-subtitles-outline" size="small" color="primary" />
                      <span class="text-body-2 font-weight-medium">Subtitles</span>
                    </div>
                    <pre class="subtitle-content">{{ props.job.openAi.srtContent }}</pre>
                  </v-sheet>
                </div>

                <v-alert
                  v-if="props.job.openAi.status === 'Failed' && props.job.openAi.errorMessage"
                  type="error"
                  variant="tonal"
                  class="mb-4"
                >
                  {{ props.job.openAi.errorMessage }}
                </v-alert>

              </v-sheet>
            </v-window-item>

            <v-window-item value="google">
              <v-sheet class="details-panel pa-5" border rounded="xl">
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

                <v-sheet
                  v-if="hasTimings(props.job.googleChirp)"
                  class="timings-panel mb-4 pa-3"
                  border
                  rounded="lg"
                >
                  <div class="d-flex align-center ga-2 mb-2">
                    <v-icon icon="mdi-timer-outline" size="small" color="secondary" />
                    <span class="text-body-2 font-weight-medium">Timing breakdown</span>
                  </div>

                  <div class="timings-grid">
                    <div class="timings-stat">
                      <span class="timings-stat__label">Total</span>
                      <span class="timings-stat__value">{{ formatTiming(props.job.googleChirp.timings?.totalMs) }}</span>
                    </div>
                    <div class="timings-stat">
                      <span class="timings-stat__label">Transcription</span>
                      <span class="timings-stat__value">{{ formatTiming(props.job.googleChirp.timings?.transcriptionMs) }}</span>
                    </div>
                    <div class="timings-stat">
                      <span class="timings-stat__label">FFmpeg</span>
                      <span class="timings-stat__value">{{ formatTiming(props.job.googleChirp.timings?.ffmpegMs) }}</span>
                    </div>
                    <div class="timings-stat">
                      <span class="timings-stat__label">Remaining</span>
                      <span class="timings-stat__value">{{ formatTiming(remainingTiming(props.job.googleChirp.timings)) }}</span>
                    </div>
                  </div>
                </v-sheet>

                <div
                  v-if="props.job.googleChirp.videoUrl || props.job.googleChirp.srtContent"
                  class="mb-4 details-media-layout"
                  :class="{ 'details-media-layout--split': props.job.googleChirp.videoUrl && props.job.googleChirp.srtContent }"
                >
                  <div v-if="props.job.googleChirp.videoUrl" class="details-media-video">
                    <video
                      :src="props.job.googleChirp.videoUrl"
                      controls
                      preload="metadata"
                      class="details-video"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>

                  <v-sheet v-if="props.job.googleChirp.srtContent" class="subtitle-panel pa-3" border rounded="lg">
                    <div class="d-flex align-center ga-2 mb-2">
                      <v-icon icon="mdi-subtitles-outline" size="small" color="secondary" />
                      <span class="text-body-2 font-weight-medium">Subtitles</span>
                    </div>
                    <pre class="subtitle-content">{{ props.job.googleChirp.srtContent }}</pre>
                  </v-sheet>
                </div>

                <v-alert
                  v-if="props.job.googleChirp.status === 'Failed' && props.job.googleChirp.errorMessage"
                  type="error"
                  variant="tonal"
                  class="mb-4"
                >
                  {{ props.job.googleChirp.errorMessage }}
                </v-alert>

              </v-sheet>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { LyricsVideoJob, ProviderResult, ProviderTimings } from '@/types/lyricsVideo'
import StatusChip from './StatusChip.vue'

const props = defineProps<{
  job: LyricsVideoJob
  deleting?: boolean
}>()

const emit = defineEmits<{
  remove: [jobId: string]
}>()

const detailsOpen = ref(false)
const detailsTab = ref<'openAi' | 'google'>('openAi')

const sourceLabel = computed(() => {
  return props.job.sourceType === 'UploadedFile' ? 'File upload' : 'BandLab track'
})

const sourceIcon = computed(() => {
  return props.job.sourceType === 'UploadedFile' ? 'mdi-file-upload-outline' : 'mdi-music-note-outline'
})

const dialogTitle = computed(() => {
  return props.job.metadata?.songName
    || (props.job.sourceType === 'UploadedFile' ? 'Uploaded File' : 'BandLab Track')
})

function openDetails() {
  detailsTab.value = 'openAi'
  detailsOpen.value = true
}

function isProcessing(result: ProviderResult): boolean {
  return result.status === 'Transcribing' || result.status === 'GeneratingVideo'
}

function hasTimings(result: ProviderResult): boolean {
  return result.timings != null && Object.values(result.timings).some((value) => value != null)
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

function formatTiming(value?: number | null): string {
  if (value == null) {
    return '--'
  }

  if (value < 1000) {
    return `${value} ms`
  }

  if (value < 60_000) {
    return `${(value / 1000).toFixed(1)} s`
  }

  const minutes = Math.floor(value / 60_000)
  const seconds = ((value % 60_000) / 1000).toFixed(1)
  return `${minutes}m ${seconds}s`
}

function remainingTiming(timings?: ProviderTimings | null): number | null {
  if (!timings?.totalMs) {
    return null
  }

  const transcription = timings.transcriptionMs ?? 0
  const ffmpeg = timings.ffmpegMs ?? 0
  const remaining = timings.totalMs - transcription - ffmpeg

  return remaining > 0 ? remaining : 0
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
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 252, 255, 0.98) 100%),
    rgba(var(--v-theme-surface), 1);
  box-shadow: 0 14px 30px rgba(38, 57, 77, 0.06);
}

.job-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: start;
  gap: 20px;
}

.job-main {
  align-items: flex-start;
}

.job-avatar {
  box-shadow: 0 8px 18px rgba(38, 57, 77, 0.12);
}

.job-source-chip {
  padding-inline: 4px;
  min-height: 24px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-size: 11px;
  line-height: 1.2;
  font-weight: 600;
}

.job-date-pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(var(--v-theme-primary), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-size: 12px;
  line-height: 1.2;
  font-weight: 500;
}

.job-title {
  font-size: 15px;
  line-height: 1.25;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.92);
}

.job-subline {
  min-height: 18px;
}

.job-creator-line {
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.job-creator-name {
  font-size: 13px;
  line-height: 1.25;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.82);
}

.job-submitted-line {
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.job-submitted-text {
  font-size: 12px;
  line-height: 1.2;
  font-weight: 500;
}

.job-statuses {
  justify-content: flex-end;
  gap: 12px;
  align-self: start;
}

.job-status-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-width: 130px;
  padding: 10px 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 14px;
  background: rgba(var(--v-theme-surface), 0.96);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.job-status-label {
  font-size: 12px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.56);
  font-weight: 600;
}

.job-status-time-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(var(--v-theme-primary), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.74);
  font-size: 11px;
  line-height: 1.2;
  font-weight: 600;
}

.job-status-time-pill :deep(.v-icon) {
  opacity: 0.72;
}

.job-actions {
  align-items: flex-start;
  align-self: start;
  padding-top: 4px;
}

.job-link-pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  font-size: 12px;
  line-height: 1.2;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 120ms ease, transform 120ms ease;
}

.job-link-pill:hover {
  background: rgba(var(--v-theme-primary), 0.16);
  transform: translateY(-1px);
}

.details-panel {
  height: 100%;
}

.details-body {
  background: rgba(var(--v-theme-background), 0.55);
}

.details-tab-bar {
  display: flex;
  gap: 12px;
  background: rgba(var(--v-theme-surface), 0.96);
}

.details-tab-button {
  min-width: 150px;
  min-height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.03);
  color: rgba(var(--v-theme-on-surface), 0.74);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
}

.details-tab-button--active {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  border-color: rgba(var(--v-theme-primary), 0.18);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.details-window {
  overflow: visible;
}

.details-provider-row {
  row-gap: 20px;
}

.timings-panel {
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.timings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.timings-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(var(--v-theme-surface), 0.92);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.timings-stat__label {
  font-size: 11px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.58);
  font-weight: 600;
}

.timings-stat__value {
  font-size: 13px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.88);
  font-weight: 700;
}

.details-media-layout {
  --details-video-width: clamp(260px, 24vw, 320px);
  display: grid;
  gap: 16px;
}

.details-media-layout--split {
  grid-template-columns: var(--details-video-width) minmax(0, 1fr);
  align-items: stretch;
}

.details-media-video {
  display: flex;
  justify-content: center;
}

.details-video {
  display: block;
  width: min(100%, var(--details-video-width));
  aspect-ratio: 9 / 16;
  max-height: 68vh;
  margin-inline: auto;
  border-radius: 16px;
  background: #000;
  object-fit: contain;
}

.subtitle-panel {
  display: flex;
  flex-direction: column;
  height: min(68vh, calc(var(--details-video-width) * 16 / 9));
  min-height: 0;
  overflow: hidden;
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.subtitle-content {
  white-space: pre-wrap;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.45;
  margin: 0;
}

@media (max-width: 960px) {
  .job-row {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .job-statuses {
    justify-content: flex-start;
  }

  .job-actions {
    padding-top: 0;
  }

  .timings-grid {
    grid-template-columns: 1fr;
  }

  .details-tab-bar {
    flex-direction: column;
  }

  .details-tab-button {
    width: 100%;
  }
}
</style>
