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

    <div class="d-flex align-center justify-space-between mb-3 ga-2">
      <span class="text-caption text-medium-emphasis">{{ helperText }}</span>
      <v-btn
        v-if="result.status === 'Completed' && result.videoUrl"
        size="small"
        variant="tonal"
        color="primary"
        prepend-icon="mdi-play-circle-outline"
        @click="emit('preview', result.videoUrl)"
      >
        Preview
      </v-btn>
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

const emit = defineEmits<{
  preview: [videoUrl: string]
}>()

const PROCESSING_STATUSES: LyricsVideoStatus[] = [
  'Transcribing',
  'GeneratingVideo',
]

const isProcessing = computed(() => PROCESSING_STATUSES.includes(props.result.status))

const helperText = computed(() => {
  switch (props.result.status) {
    case 'Pending':
      return 'Queued and waiting to start'
    case 'Transcribing':
      return 'Extracting lyrics and timing'
    case 'GeneratingVideo':
      return 'Rendering final video'
    case 'Completed':
      return 'Video is ready to preview'
    case 'Failed':
      return props.result.errorMessage || 'Generation failed'
    default:
      return ''
  }
})
</script>
