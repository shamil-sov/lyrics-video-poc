<template>
  <div>
    <!-- Provider Header -->
    <div class="d-flex align-center mb-3">
      <v-icon :icon="icon" size="small" class="mr-2" />
      <span class="text-subtitle-2 font-weight-medium">{{ provider }}</span>
      <v-spacer />
      <StatusChip :status="result.status" />
    </div>

    <!-- Progress Bar for active statuses -->
    <v-progress-linear
      v-if="isProcessing"
      indeterminate
      color="info"
      class="mb-3"
      rounded
    />

    <!-- Video Player -->
    <div v-if="result.status === 'Completed' && result.videoUrl" class="mb-3">
      <video
        :src="result.videoUrl"
        controls
        preload="metadata"
        style="width: 100%; border-radius: 8px; background: #000"
      >
        Your browser does not support the video tag.
      </video>
    </div>

    <!-- Error Message -->
    <v-alert
      v-if="result.status === 'Failed' && result.errorMessage"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-3 text-body-2"
    >
      {{ result.errorMessage }}
    </v-alert>

    <!-- SRT Content (expandable) -->
    <v-expansion-panels v-if="result.srtContent" variant="accordion" flat>
      <v-expansion-panel>
        <v-expansion-panel-title class="text-body-2 py-2" style="min-height: 36px">
          <v-icon size="small" class="mr-2">mdi-subtitles</v-icon>
          View SRT Subtitles
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <pre class="text-caption" style="white-space: pre-wrap; max-height: 200px; overflow-y: auto">{{ result.srtContent }}</pre>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProviderResult, LyricsVideoStatus } from '@/types/lyricsVideo'
import StatusChip from './StatusChip.vue'

const props = defineProps<{
  provider: string
  icon: string
  result: ProviderResult
}>()

const PROCESSING_STATUSES: LyricsVideoStatus[] = [
  'Transcribing',
  'GeneratingVideo',
]

const isProcessing = computed(() => PROCESSING_STATUSES.includes(props.result.status))
</script>
